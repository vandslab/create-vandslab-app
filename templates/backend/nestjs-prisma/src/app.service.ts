import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async example(): Promise<string> {
    return 'API is running';
  }
}
