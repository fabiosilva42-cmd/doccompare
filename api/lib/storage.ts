import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

let clientInstance: S3Client | null = null;

function getClient(): S3Client | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null;
  if (!clientInstance) {
    clientInstance = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return clientInstance;
}

function getBucket(): string {
  return process.env.AWS_BUCKET_NAME || "doccompare-uploads";
}

export function storageDisponivel(): boolean {
  return getClient() !== null;
}

/**
 * Sobe o binário do documento para o S3. Retorna a chave do objeto,
 * ou null se o storage não estiver configurado ou falhar — o upload do
 * documento nunca deve quebrar por causa do S3 (o texto extraído no banco
 * continua sendo a fonte usada pela IA).
 */
export async function uploadDocumento(
  buffer: Buffer,
  opts: { pedidoId: number; nomeOriginal: string; mimeType: string }
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const nomeSeguro = opts.nomeOriginal.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const key = `pedidos/${opts.pedidoId}/${nanoid(10)}-${nomeSeguro}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: buffer,
        ContentType: opts.mimeType,
      })
    );
    return key;
  } catch (err) {
    console.error("[S3] Falha no upload, documento segue sem binário:", err);
    return null;
  }
}

/**
 * URL pré-assinada de download (privada, expira em 15 minutos).
 */
export async function urlDownload(s3Key: string, expiresIn = 900): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: getBucket(), Key: s3Key }),
      { expiresIn }
    );
  } catch (err) {
    console.error("[S3] Falha ao gerar URL de download:", err);
    return null;
  }
}
