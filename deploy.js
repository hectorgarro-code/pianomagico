import * as ftp from "basic-ftp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración desde deploy.config.json si existe
let config = {
  host: "212.1.211.185",
  user: "u803496046.pianomagico", // Nombre de usuario FTP en Hostinger
  password: "6A8edb2013",
  port: 21,
  remoteRoot: "/public_html"
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
  console.log("🚀 1. Compilando proyecto de producción...");
  execSync("npm run build", { stdio: "inherit" });

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log(`\n🔌 2. Conectando a FTP Hostinger (${config.host} con usuario ${config.user})...`);
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false
    });

    console.log(`\n📁 3. Subiendo dist/ a ${config.remoteRoot}...`);
    await client.uploadFromDir(path.join(__dirname, "dist"), config.remoteRoot);

    console.log(`\n🐘 4. Subiendo backend/ a ${config.remoteRoot}/backend...`);
    await client.uploadFromDir(path.join(__dirname, "backend"), `${config.remoteRoot}/backend`);

    console.log("\n🎉 ¡DESPLIEGUE FTP COMPLETADO CON ÉXITO EN HOSTINGER!");
  } catch (err) {
    console.error("❌ Error durante el deploy FTP:", err.message || err);
    if (String(err).includes("530")) {
      console.log("\n💡 Si la cuenta FTP fue recién creada, verifica haber presionado 'Crear' en Hostinger o confirma el nombre exacto de usuario (ej. u803496046.pianomagico).");
    }
  } finally {
    client.close();
  }
}

deploy();
