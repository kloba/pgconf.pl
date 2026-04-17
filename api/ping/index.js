module.exports = async (context) => {
  context.log('ping invoked');
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, runtime: process.version }),
  };
};
