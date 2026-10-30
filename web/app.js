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
