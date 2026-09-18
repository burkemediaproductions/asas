(()=>{
  const form=document.getElementById('asas-assessment');
  const calc=document.getElementById('calculate-assessment');
  if(form&&calc){
    calc.addEventListener('click',()=>{
      if(!form.reportValidity()) return;
      const scores={A:0,B:0,C:0,D:0,E:0};
      for(const el of form.querySelectorAll('input[type=radio]:checked')) scores[el.name[0]]+=Number(el.value);
      let total=Object.values(scores).reduce((a,b)=>a+b,0);
      for(const k of Object.keys(scores)) document.getElementById('score-'+k).textContent=scores[k];
      document.getElementById('score-total').textContent=total;
      let band='',text='';
      if(total<=20){band='0-20 - Minimal Indicators';text='Few or no alienation-related behaviors are present.'}
      else if(total<=60){band='21-60 - Mild Indicators';text='Some patterns appear occasionally; may reflect tension, miscommunication, or early-stage exclusion.'}
      else if(total<=100){band='61-100 - Moderate Indicators';text='Multiple domains show consistent patterns; alienation behaviors may be affecting relationships and communication.'}
      else if(total<=140){band='101-140 - Significant Indicators';text='Alienation behaviors are frequent, patterned, and likely impacting family structure, caregiving, and emotional connection.'}
      else {band='141-160 - Severe Indicators';text='Alienation behaviors are pervasive across domains; strong likelihood of structural family disruption, estrangement, or long-term relational harm.'}
      document.getElementById('score-band').textContent=band; document.getElementById('score-text').textContent=text;
      document.getElementById('ciem-next').hidden=total<=100;
      const r=document.getElementById('assessment-results'); r.hidden=false; r.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  const cf=document.getElementById('ciem-assessment'); const cc=document.getElementById('calculate-ciem');
  if(cf&&cc){cc.addEventListener('click',()=>{if(!cf.reportValidity()) return; let total=0; for(const el of cf.querySelectorAll('input[type=radio]:checked')) total+=Number(el.value); document.getElementById('ciem-total').textContent=total; let band=total<=10?'0-10 Minimal external expansion':total<=22?'11-22 Moderate expansion':total<=34?'23-34 Significant expansion':'35-48 Systemic / institutional alienation'; document.getElementById('ciem-band').textContent=band; const r=document.getElementById('ciem-results'); r.hidden=false; r.scrollIntoView({behavior:'smooth',block:'start'});});}
})();
