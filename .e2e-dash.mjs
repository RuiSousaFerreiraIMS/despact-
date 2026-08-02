import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("=")&&!l.startsWith("#")).map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1).trim()]));
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const ts = Date.now();
const { data, error } = await supabase.auth.signUp({ email:`e2e-dash-${ts}@despact.test`, password:`E2e!${ts}x`, options:{data:{display_name:"Rui"}} });
if(error||!data.session){console.error("signup falhou", error?.message);process.exit(1);}
const uid=data.user.id;
const { data: acc } = await supabase.from("accounts").insert({ user_id: uid, name:"Conta à ordem", type:"current", currency_code:"EUR", opening_balance_minor:300000 }).select().single();
const cats={};
for(const [n,t] of [["Supermercado","expense"],["Restaurantes e cafés","expense"],["Transportes","expense"],["Saúde","expense"],["Lazer","expense"],["Subscrições","expense"],["Salário","income"]]){
  const { data: c } = await supabase.from("categories").select("id").eq("name",n).eq("type",t).maybeSingle();
  cats[n]=c?.id;
}
const now=new Date(); const tx=[];
function d(m,day){return new Date(now.getFullYear(),now.getMonth()-m,day).toISOString().slice(0,10);}
for(let m=5;m>=0;m--){
  tx.push({user_id:uid,account_id:acc.id,kind:"income",amount_minor:185000,currency_code:"EUR",occurred_on:d(m,1),description:"Salário",category_id:cats["Salário"]});
  tx.push({user_id:uid,account_id:acc.id,kind:"expense",amount_minor:-(9000+m*500),currency_code:"EUR",occurred_on:d(m,5),description:"Continente",category_id:cats["Supermercado"]});
  tx.push({user_id:uid,account_id:acc.id,kind:"expense",amount_minor:-3200,currency_code:"EUR",occurred_on:d(m,12),description:"McDonald's",category_id:cats["Restaurantes e cafés"]});
  tx.push({user_id:uid,account_id:acc.id,kind:"expense",amount_minor:-6000,currency_code:"EUR",occurred_on:d(m,15),description:"Combustível",category_id:cats["Transportes"]});
  tx.push({user_id:uid,account_id:acc.id,kind:"expense",amount_minor:-1290,currency_code:"EUR",occurred_on:d(m,3),description:"Netflix",category_id:cats["Subscrições"]});
  tx.push({user_id:uid,account_id:acc.id,kind:"expense",amount_minor:-4000,currency_code:"EUR",occurred_on:d(m,22),description:"Casino",category_id:cats["Lazer"]});
}
await supabase.from("transactions").insert(tx);
writeFileSync(process.env.TEMP+"/dash-js.txt", "document.cookie='sb-"+ref+"-auth-token=base64-"+Buffer.from(JSON.stringify(data.session)).toString("base64url")+"; path=/'; window.location.href='/';");
console.log("OK", tx.length, "movimentos");
