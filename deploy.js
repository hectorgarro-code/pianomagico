import * as ftp from "basic-ftp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let config = {
  host: "212.1.211.185",
  user: "u803496046.pianomagico",
  password: "6A8edb2013",
  port: 21,
  remoteRoot: "/" // El usuario FTP u803496046.pianomagico ya apunta directamente a public_html
};

const configPath = path.join(__dirname, "deploy.config.json");
if (fs.existsSync(configPath)) {
  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config = { ...config, ...userConfig };
  } catch (e) {
    console.warn("⚠️ No se pudo leer deploy.config.json, usando valores por defecto.");
  }
}

async function deploy() {
  console.log("🚀 1. Compilando proyecto de producción con Vite...");
  execSync("npm run build", { stdio: "inherit" });

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log(`\n🔌 2. Conectando a FTP Hostinger (${config.host} como ${config.user})...`);
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false
    });

    console.log(`\n📁 3. Subiendo contenido compilado (dist/) directamente a la raíz web...`);
    await client.uploadFromDir(path.join(__dirname, "dist"), config.remoteRoot);

    console.log(`\n🐘 4. Subiendo backend PHP (backend/) a /backend...`);
    await client.uploadFromDir(path.join(__dirname, "backend"), `${config.remoteRoot === '/' ? '' : config.remoteRoot}/backend`);

    console.log("\n🎉 ¡DESPLIEGUE FTP COMPLETADO CON ÉXITO EN HOSTINGER!");
  } catch (err) {
    console.error("❌ Error durante el deploy FTP:", err.message || err);
  } finally {
    client.close();
  }
}

deploy();
