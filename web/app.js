const form=document.querySelector('#studioForm');let plan=null;form.addEventListener('submit',event=>{event.preventDefault();const topic=document.querySelector('#topic').value.trim();const custom=document.querySelector('#script').value.trim();const duration=Number(document.querySelector('#duration').value);if(!Number.isInteger(duration)||duration<5||duration>600)return alert('Choose 5 to 600 seconds.');if(!custom&&!topic)return alert('Enter a topic or script.');const scenes=custom?custom.split(/\n+/).map(s=>s.trim()).filter(Boolean):[`Once upon a time, there was ${topic}.`,'Every day brought a new challenge and a quiet hope.','One unexpected moment changed everything.','A small act of kindness made the world brighter.'];if(!scenes.length)return alert('Enter at least one scene.');plan={topic,duration,style:document.querySelector('#style').value,ratio:document.querySelector('#ratio').value,voice:document.querySelector('#voice').value,loop:document.querySelector('#loop').value,scenes:scenes.map((text,i)=>({number:i+1,seconds:Number((duration/scenes.length).toFixed(2)),text}))};document.querySelector('#summary').textContent=`${duration} seconds • ${plan.style} • ${plan.ratio} • Voice: ${plan.voice} • Loop: ${plan.loop}`;const list=document.querySelector('#scenes');list.replaceChildren();for(const scene of plan.scenes){const li=document.createElement('li');li.textContent=`${scene.seconds}s — ${scene.text}`;list.append(li)}document.querySelector('#result').hidden=false;document.querySelector('#result').scrollIntoView({behavior:'smooth'});});document.querySelector('#download').addEventListener('click',()=>{if(!plan)return;const blob=new Blob([JSON.stringify(plan,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='video-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
// Optional Vercel backend helpers: no false success when rendering is unavailable.
async function checkBackend(){try{const r=await fetch('/api/health');if(!r.ok)return;const data=await r.json();const status=document.querySelector('.studio .status');if(status)status.textContent=data.rendererConfigured?'● Renderer configured':'● Planner ready · renderer not connected';}catch{}}
checkBackend();


// Free browser-based voice preview (uses installed system voices; no API key).
// This is speech playback, not a downloadable audio track or an MP4 renderer.
if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
  const result = document.querySelector('#result');
  const preview = document.createElement('button');
  preview.type = 'button';
  preview.className = 'btn secondary';
  preview.textContent = '▶ Preview Voice';
  preview.style.marginLeft = '0.75rem';
  document.querySelector('#download').insertAdjacentElement('afterend', preview);
  preview.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    if (!plan || !plan.scenes?.length) return;
    if (plan.voice === 'no') return alert('Set Voiceover to On to preview narration.');
    const utterance = new SpeechSynthesisUtterance(plan.scenes.map(s => s.text).join(' '));
    utterance.rate = 0.92;
    utterance.onend = () => { preview.textContent = '▶ Preview Voice'; };
    utterance.onerror = () => { preview.textContent = '▶ Preview Voice'; };
    preview.textContent = '■ Stop Voice';
    window.speechSynthesis.speak(utterance);
  });
  preview.addEventListener('dblclick', () => {
    window.speechSynthesis.cancel();
    preview.textContent = '▶ Preview Voice';
  });
}


// Prototype image generation + browser-rendered slideshow export.
// Image generation relies on a public third-party endpoint and can be rate-limited.
// Video export is silent; MP4 is offered only if this browser supports MP4 recording.
const featureBar = document.createElement('div');
featureBar.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem';
const imageBtn = document.createElement('button');
imageBtn.type = 'button'; imageBtn.className = 'btn primary'; imageBtn.textContent = '✦ Generate Scene Images';
const videoBtn = document.createElement('button');
videoBtn.type = 'button'; videoBtn.className = 'btn secondary'; videoBtn.textContent = '▶ Export Slideshow Video';
document.querySelector('#download').insertAdjacentElement('afterend', featureBar);
featureBar.append(imageBtn, videoBtn);
const gallery = document.createElement('div');
gallery.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:1rem';
featureBar.insertAdjacentElement('afterend', gallery);
let generatedImages = [];

imageBtn.addEventListener('click', async () => {
  if (!plan?.scenes?.length) return alert('First create a scene plan.');
  imageBtn.disabled = true; generatedImages = []; gallery.replaceChildren();
  try {
    for (const scene of plan.scenes.slice(0, 8)) {
      imageBtn.textContent = `Generating image ${scene.number}…`;
      const response = await fetch('/api/generate-image', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({prompt: scene.text, style: plan.style})
      });
      if (!response.ok) throw new Error((await response.json().catch(()=>({}))).error || 'Image provider failed.');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      generatedImages.push({scene, objectUrl});
      const card = document.createElement('figure');
      card.style.cssText = 'margin:0;background:#20242b;padding:8px;border-radius:10px';
      const img = document.createElement('img'); img.src=objectUrl; img.alt='Generated scene '+scene.number;
      img.style.cssText='width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px';
      const cap = document.createElement('figcaption'); cap.textContent='Scene '+scene.number+': '+scene.text;
      cap.style.cssText='font-size:.85rem;padding:8px 0;color:#eee';
      card.append(img,cap); gallery.append(card);
    }
    imageBtn.textContent = '✦ Generate Scene Images';
    if (plan.scenes.length > 8) alert('Generated the first 8 scenes to avoid excessive public-provider requests.');
  } catch (error) {
    imageBtn.textContent = '✦ Generate Scene Images';
    alert('Image generation did not finish: '+error.message+' Public provider availability and rate limits may vary.');
  } finally { imageBtn.disabled = false; }
});

videoBtn.addEventListener('click', async () => {
  if (!plan?.scenes?.length) return alert('First create a scene plan.');
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return alert('This browser does not support canvas video export.');
  if (!generatedImages.length) return alert('Generate scene images first. The export uses those still images, not AI motion animation.');
  const preferred = ['video/mp4;codecs=h264','video/mp4','video/webm;codecs=vp9','video/webm'];
  const mime = preferred.find(t => MediaRecorder.isTypeSupported(t));
  if (!mime) return alert('No supported MP4/WebM recording format was found in this browser.');
  videoBtn.disabled=true; videoBtn.textContent='Rendering video…';
  try {
    const canvas=document.createElement('canvas'); canvas.width=1280; canvas.height=720;
    const ctx=canvas.getContext('2d'); const stream=canvas.captureStream(24);
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000});
    const chunks=[]; recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    const finished=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error('Recording failed'))});
    recorder.start();
    const frames=await Promise.all(generatedImages.map(async item=>({item,img:await createImageBitmap(await (await fetch(item.objectUrl)).blob())})));
    const total=Math.max(5,Math.min(600,plan.duration)); const perScene=total/frames.length;
    for(let i=0;i<frames.length;i++){
      const {item,img}=frames[i]; const start=performance.now();
      while(performance.now()-start < perScene*1000){
        ctx.fillStyle='#17191f';ctx.fillRect(0,0,canvas.width,canvas.height);
        const scale=Math.max(canvas.width/img.width,canvas.height/img.height);
        const w=img.width*scale,h=img.height*scale;
        // Gentle pan/zoom makes a slideshow, not generated AI motion.
        const progress=Math.min(1,(performance.now()-start)/(perScene*1000));
        const zoom=1+progress*.035;
        ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.scale(zoom,zoom);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
        ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(0,canvas.height-105,canvas.width,105);
        ctx.fillStyle='#fff';ctx.font='bold 30px sans-serif';ctx.fillText('AI Art Video Studio',36,canvas.height-64);
        ctx.font='22px sans-serif';ctx.fillText(item.scene.text.slice(0,100),36,canvas.height-28);
        await new Promise(r=>setTimeout(r,1000/24));
      }
    }
    recorder.stop(); await finished; stream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:mime}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=mime.includes('mp4')?'ai-art-video.mp4':'ai-art-video.webm';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    if(!mime.includes('mp4')) alert('Your browser does not support MP4 recording, so a WebM video was downloaded instead. This export has no voice track.');
  } catch(e) { alert('Video export failed: '+e.message); }
  finally { videoBtn.disabled=false;videoBtn.textContent='▶ Export Slideshow Video'; }
});
