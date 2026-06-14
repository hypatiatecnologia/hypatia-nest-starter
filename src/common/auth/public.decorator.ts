import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/** Marks a route as publicly accessible without JWT or API key. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
