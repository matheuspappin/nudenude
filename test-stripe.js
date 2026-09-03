require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

async function testStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não encontrada no .env.local');
    process.exit(1);
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    console.log('⏳ Verificando conexão com o Stripe e testando saldo...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ Conexão bem sucedida!');
    console.log('💰 Saldo:', balance.available);
    
    console.log('\n⏳ Testando criação de conta Connect Express (Simulação)...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      capabilities: {
        transfers: { requested: true },
      },
    });
    console.log('✅ Conta Connect Express criada com sucesso. ID:', account.id);
    
    console.log('\n⏳ Testando link de Onboarding (OAuth)...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3005/dashboard',
      return_url: 'http://localhost:3005/dashboard',
      type: 'account_onboarding',
    });
    console.log('✅ Link de Onboarding gerado com sucesso:', accountLink.url);
    console.log('\n✅✅✅ TUDO FUNCIONANDO PERFEITAMENTE! ✅✅✅');

  } catch (error) {
    console.error('❌ Erro no teste do Stripe:', error.message);
  }
}

testStripe();
