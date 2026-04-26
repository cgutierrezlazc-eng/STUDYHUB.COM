/* ═══ ORBIT-U · Theme Engine ═══
   Carga/guarda tokens CSS en localStorage (conniku-theme-v1).
   Expone: thLoad(), thSet(token, value), thApplyPreset(name)
   NO usar en orbit-u.html (tema fijo dark).
   Requiere: tokens.css cargado antes */
(function(){
'use strict';
const STORE_KEY = 'conniku-theme-v1';
const PRESET_KEY = 'conniku-theme-preset';
const TOKENS = [
  '--bg','--surface','--surface-2','--surface-3',
  '--border','--border-2',
  '--text','--text-2','--text-3','--text-4',
  '--green','--green-2','--green-3','--lime','--orange',
  '--violet','--cyan','--cream','--pink','--paper'
];

const PRESETS = {
  'orbit-dark': {
    '--bg':'#050608','--surface':'#0D0E11','--surface-2':'#15181D','--surface-3':'#1A1D23',
    '--border':'#262A32','--border-2':'#1F2229',
    '--text':'#E8E8E6','--text-2':'#B8B8B4','--text-3':'#8A8A86','--text-4':'#5C5F65',
    '--green':'#00C27A','--green-2':'#006E4A','--green-3':'#8AEAC0',
    '--lime':'#D9FF3A','--orange':'#FF4A1C',
    '--violet':'#6B4EFF','--cyan':'#00C2FF','--cream':'#FFE9B8','--pink':'#FF4D3A','--paper':'#F5F4EF'
  },
  'editorial-paper': {
    '--bg':'#F5F4EF','--surface':'#FFFFFF','--surface-2':'#EBE9E1','--surface-3':'#DBD9CF',
    '--border':'#D2CFC3','--border-2':'#E2DFD4',
    '--text':'#0D0F10','--text-2':'#2B2E30','--text-3':'#696C6F','--text-4':'#A0A3A7',
    '--green':'#0D7A4D','--green-2':'#054A2F','--green-3':'#5BD9A0',
    '--lime':'#D9FF3A','--orange':'#FF4A1C',
    '--violet':'#5B3FE0','--cyan':'#0096CC','--cream':'#E8B83A','--pink':'#E03A2A','--paper':'#F5F4EF'
  },
  'skool-clean': {
    '--bg':'#EDF2F7','--surface':'#FFFFFF','--surface-2':'#E5EBF2','--surface-3':'#D1DAE5',
    '--border':'#C1CBD7','--border-2':'#DBE1E8',
    '--text':'#1B2838','--text-2':'#3F4C5C','--text-3':'#697584','--text-4':'#A0ACB9',
    '--green':'#0A66C2','--green-2':'#004182','--green-3':'#5BA7E8',
    '--lime':'#FFD96B','--orange':'#E04C3D',
    '--violet':'#7E5CDE','--cyan':'#14B8D4','--cream':'#F6D27B','--pink':'#E94A80','--paper':'#FFFFFF'
  },
  'cosmic-violet': {
    '--bg':'#0A081A','--surface':'#13102B','--surface-2':'#1C1838','--surface-3':'#251F45',
    '--border':'#2D2752','--border-2':'#241F44',
    '--text':'#EFEAF8','--text-2':'#C5BCDB','--text-3':'#8A82A8','--text-4':'#5C547A',
    '--green':'#A78BFA','--green-2':'#7C3AED','--green-3':'#DDD6FE',
    '--lime':'#FAEB6E','--orange':'#F472B6',
    '--violet':'#C084FC','--cyan':'#67E8F9','--cream':'#FCD34D','--pink':'#F472B6','--paper':'#EFEAF8'
  }
};

const DEFAULTS = {};
function rgbToHex(rgb){
  const m = rgb.match(/\d+/g); if(!m||m.length<3) return rgb.trim();
  const h = (n)=>parseInt(n).toString(16).padStart(2,'0');
  return ('#'+h(m[0])+h(m[1])+h(m[2])).toUpperCase();
}
function readDefault(token){
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if(!v) return '#000000';
  if(v.startsWith('#')) return v.toUpperCase();
  return rgbToHex(v);
}

function thLoad(){
  TOKENS.forEach(t=> DEFAULTS[t] = readDefault(t));
  const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  Object.entries(stored).forEach(([t,v])=> document.documentElement.style.setProperty(t,v));
  TOKENS.forEach(t=>{
    const row = document.querySelector(`[data-token="${t}"]`);
    if(!row) return;
    const v = stored[t] || DEFAULTS[t];
    const colorIn = row.querySelector('input[type=color]');
    const hexIn = row.querySelector('.th-hex');
    if(colorIn) colorIn.value = v;
    if(hexIn) hexIn.value = v;
  });
}

function thSet(token, value){
  document.documentElement.style.setProperty(token, value);
  const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  stored[token] = value.toUpperCase();
  localStorage.setItem(STORE_KEY, JSON.stringify(stored));
  const row = document.querySelector(`[data-token="${token}"]`);
  if(row){
    const colorIn = row.querySelector('input[type=color]');
    const hexIn = row.querySelector('.th-hex');
    if(colorIn && colorIn.value.toLowerCase() !== value.toLowerCase()) colorIn.value = value;
    if(hexIn && hexIn.value.toUpperCase() !== value.toUpperCase()) hexIn.value = value.toUpperCase();
  }
}

function thApplyPreset(name){
  const preset = PRESETS[name];
  if(!preset) return;
  const stored = {};
  Object.entries(preset).forEach(([t,v])=>{
    document.documentElement.style.setProperty(t,v);
    stored[t] = v.toUpperCase();
  });
  localStorage.setItem(STORE_KEY, JSON.stringify(stored));
  localStorage.setItem(PRESET_KEY, name);
  TOKENS.forEach(t=>{
    const row = document.querySelector(`[data-token="${t}"]`);
    if(!row) return;
    const v = preset[t];
    if(!v) return;
    const colorIn = row.querySelector('input[type=color]');
    const hexIn = row.querySelector('.th-hex');
    if(colorIn) colorIn.value = v;
    if(hexIn) hexIn.value = v.toUpperCase();
  });
  document.querySelectorAll('.th-preset').forEach(p=> p.classList.toggle('active', p.dataset.preset === name));
}

function thBindEvents(){
  document.querySelectorAll('#th-body .th-row').forEach(row=>{
    const token = row.dataset.token;
    const colorIn = row.querySelector('input[type=color]');
    const hexIn = row.querySelector('.th-hex');
    if(colorIn) colorIn.addEventListener('input', e=> thSet(token, e.target.value));
    if(hexIn) hexIn.addEventListener('change', e=>{
      let v = e.target.value.trim();
      if(!v.startsWith('#')) v = '#'+v;
      if(/^#[0-9a-f]{6}$/i.test(v)) thSet(token, v);
      else hexIn.value = colorIn.value.toUpperCase();
    });
  });
  document.querySelectorAll('.th-preset').forEach(card=>{
    card.addEventListener('click', ()=> thApplyPreset(card.dataset.preset));
  });
  const activePreset = localStorage.getItem(PRESET_KEY) || 'orbit-dark';
  const activeCard = document.querySelector(`.th-preset[data-preset="${activePreset}"]`);
  if(activeCard) activeCard.classList.add('active');
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>{ thLoad(); thBindEvents(); });
} else {
  thLoad(); thBindEvents();
}
})();
