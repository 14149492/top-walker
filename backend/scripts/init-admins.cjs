// Read credentials only from stdin. Never pass passwords as command arguments.
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../dist/auth/password');
const db = new PrismaClient();
async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 16384) throw new Error('Entrada demasiado grande.');
  }
  const config = JSON.parse(input.replace(/^\uFEFF/, ''));
  if (!Array.isArray(config.users) || config.users.length !== 2) throw new Error('Proporciona exactamente dos administradores.');
  const users = [];
  for (const row of config.users) {
    const username = String(row.username || '').trim().toLowerCase();
    const email = String(row.email || '').trim().toLowerCase();
    const displayName = String(row.displayName || '').trim();
    if (!/^[a-z0-9._-]{3,40}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !displayName || displayName.length > 80) throw new Error('Identidad administrativa inválida.');
    if (typeof row.password !== 'string' || row.password.length < 12 || row.password.length > 128) throw new Error('Usa contraseñas de 12 a 128 caracteres.');
    users.push({ username, email, displayName, passwordHash: await hashPassword(row.password) });
  }
  if (users[0].username === users[1].username || users[0].email === users[1].email) throw new Error('Las dos cuentas deben ser independientes.');
  await db.$transaction(async tx => {
    for (const user of users) {
      const existing = await tx.adminUser.findFirst({ where: { OR: [{ username: user.username }, { email: user.email }] } });
      if (existing) {
        if (!config.resetPasswords || existing.username !== user.username || existing.email !== user.email) throw new Error('La cuenta ya existe. Para cambiar su contraseña usa la opción explícita de restablecimiento con la misma identidad.');
        await tx.adminUser.update({ where: { id: existing.id }, data: { ...user, active: true } });
        await tx.adminSession.deleteMany({ where: { userId: existing.id } });
      } else await tx.adminUser.create({ data: user });
    }
  });
  console.log('Dos cuentas administrativas inicializadas con los mismos permisos.');
}
main().catch(() => { console.error('No se pudieron inicializar las cuentas. Revisa campos, identidades duplicadas y la opción de restablecimiento; no se modificó ninguna cuenta.'); process.exitCode = 1; }).finally(() => db.$disconnect());
