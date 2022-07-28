import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder().setTitle('Grade-ref-API').setVersion('1.0').addBearerAuth().build();
  app.enableCors({
    origin: '*',
    allowedHeaders:
      'Content-Type, Access-Control-Allow-Headers, Access-Control-Expose-Headers, Content-Disposition, Authorization, X-Requested-With',
    exposedHeaders: 'Content-Disposition',
  });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUp - Lambda is warm!');
    /** Slightly delayed (25ms) response
     to ensure concurrent invocation */
    await new Promise((r) => setTimeout(r, 25));
    return 'Lambda is warm!';
  }

  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
