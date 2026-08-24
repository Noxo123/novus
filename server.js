import http from 'node:http';
import { existsSync, statSync, createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, 'dist');
const quarantineDir = join(__dirname, 'quarantine');
const port = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
const host = process.env.SERVER_IP || process.env.HOST || '0.0.0.0';
const githubRepo = process.env.GITHUB_REPO || 'Noxo123/novus-communauter';
const githubToken = process.env.GITHUB_TOKEN;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);

mkdirSync(quarantineDir, { recursive: true });

const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2' };
const securityHeaders = { 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'" };

function send(res,status,body,type='application/json; charset=utf-8'){res.writeHead(status,{...securityHeaders,'Content-Type':type});res.end(typeof body==='string'?body:JSON.stringify(body));}
function safePath(urlPath){const decoded=decodeURIComponent(urlPath);const candidate=normalize(join(publicDir,decoded==='/'?'index.html':decoded));const rel=relative(publicDir,candidate);return rel===''||(!rel.startsWith('..'+sep)&&rel!=='..')?candidate:null;}
async function readJson(req){let total=0;const chunks=[];for await(const chunk of req){total+=chunk.length;if(total>maxUploadBytes*1.4)throw new Error('PAYLOAD_TOO_LARGE');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function cleanName(name){return basename(String(name||'contribution.bin')).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'contribution.bin';}

async function githubIssue({id,filename,size,sha256,author}){
  if(!githubToken)return null;
  const response=await fetch(`https://api.github.com/repos/${githubRepo}/issues`,{method:'POST',headers:{Authorization:`Bearer ${githubToken}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:JSON.stringify({title:`[COMMUNITY] Contribution ${filename}`,labels:['community','needs-analysis'],body:`## Nouvelle contribution\n\n- **ID:** \`${id}\`\n- **Fichier:** \`${filename}\`\n- **Taille:** ${size} octets\n- **SHA-256:** \`${sha256}\`\n- **Auteur:** ${author||'anonyme'}\n\nLe fichier est placé en quarantaine sur NOVUS et doit être analysé avant toute intégration.\n\n> Cette issue est une demande de traitement. Elle ne déclenche aucun déploiement automatique.`})});
  if(!response.ok)throw new Error(`GitHub API ${response.status}`);return response.json();
}
async function discordNotify({id,filename,size,sha256,issueUrl}){
  if(!discordWebhookUrl)return;
  const content=['📦 **NOVUS — Nouvelle contribution**',`> Fichier : **${filename}**`,`> Taille : **${size} octets**`,`> ID : \`${id}\``,`> SHA-256 : \`${sha256.slice(0,16)}…\``,issueUrl?`🔎 [Voir la proposition GitHub](${issueUrl})`:'🔎 Proposition GitHub en attente de configuration'].join('\n');
  const response=await fetch(discordWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,allowed_mentions:{parse:[]}})});if(!response.ok)throw new Error(`Discord webhook ${response.status}`);
}
async function submitContribution(req,res){
  const payload=await readJson(req);const filename=cleanName(payload.filename);const data=String(payload.data||'');const author=String(payload.author||'').slice(0,80);
  if(!['.jar','.zip'].includes(extname(filename).toLowerCase()))return send(res,400,{error:'Only .jar and .zip files are accepted.'});
  if(!data||data.length>Math.ceil(maxUploadBytes*1.4))return send(res,413,{error:'File is too large.'});
  let buffer;try{buffer=Buffer.from(data,'base64');}catch{return send(res,400,{error:'Invalid file encoding.'});}
  if(buffer.length>maxUploadBytes)return send(res,413,{error:`Maximum upload size is ${maxUploadBytes} bytes.`});
  const id=randomUUID();const sha256=createHash('sha256').update(buffer).digest('hex');const storedName=`${id}__${filename}`;writeFileSync(join(quarantineDir,storedName),buffer,{flag:'wx',mode:0o600});
  let issue=null;try{issue=await githubIssue({id,filename,size:buffer.length,sha256,author});}catch(error){console.error('GitHub contribution error:',error.message);}
  try{await discordNotify({id,filename,size:buffer.length,sha256,issueUrl:issue?.html_url});}catch(error){console.error('Discord notification error:',error.message);}
  return send(res,201,{ok:true,id,filename,size:buffer.length,sha256,issueUrl:issue?.html_url||null,status:'QUARANTINED'});
}

const server=http.createServer(async(req,res)=>{
  if(req.method==='POST'&&req.url==='/api/contributions'){try{return await submitContribution(req,res);}catch(error){if(error.message==='PAYLOAD_TOO_LARGE')return send(res,413,{error:'Payload too large.'});console.error('Contribution error:',error);return send(res,400,{error:'Invalid contribution request.'});}}
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method Not Allowed','text/plain; charset=utf-8');
  let urlPath;try{urlPath=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname;}catch{return send(res,400,'Bad Request','text/plain; charset=utf-8');}
  let requested;try{requested=safePath(urlPath);}catch{return send(res,400,'Bad Request','text/plain; charset=utf-8');}if(!requested)return send(res,403,'Forbidden','text/plain; charset=utf-8');
  const file=existsSync(requested)&&statSync(requested).isFile()?requested:join(publicDir,'index.html');if(!existsSync(file))return send(res,503,'Build not found. Run npm run build first.','text/plain; charset=utf-8');
  const type=mime[extname(file)]||'application/octet-stream';const size=statSync(file).size;res.writeHead(200,{...securityHeaders,'Content-Type':type,'Content-Length':size,'Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
});
server.on('error',error=>{console.error('NOVUS server error:',error);process.exitCode=1;});server.listen(port,host,()=>console.log(`NOVUS listening on ${host}:${port}`));
