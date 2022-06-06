import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const dotenv = require("dotenv");
const fs = require("fs").promises;
const retrieveSecrets = require("./retrieveSecrets");

async function bootstrap() {
  const secretsString = await retrieveSecrets();
  await fs.writeFile(".env", secretsString);
  console.log(secretsString);
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Grade-ref-API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  app.enableCors({ origin: '*' });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
