import { createStrapi } from '@strapi/strapi';
async function main() {
  const app = createStrapi({ serve: false });
  await app.start();
  console.log('Strapi started without HTTP server');
  await app.destroy();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
