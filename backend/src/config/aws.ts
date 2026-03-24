import AWS from 'aws-sdk';
import { config } from './index';

AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

export const ses = new AWS.SES({ apiVersion: '2010-12-01' });
