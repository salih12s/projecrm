/**
 * Express Request type augmentation — central declaration file.
 *
 * `req.user` is also augmented inside `backend/src/middleware/auth.ts` for
 * historical reasons; TypeScript merges these declarations so both files
 * stay valid. This file exists so future contributors find the canonical
 * shape in one place, and to host any further augmentations (e.g. tighter
 * `req.app.get('io')` typing) without touching middleware code.
 *
 * Runtime behavior: NONE. This is a pure ambient `.d.ts` file; it does not
 * emit any JavaScript and cannot affect request handling.
 */

import { AuthPayload } from './index';
import type { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      /**
       * JWT-decoded payload attached by `authMiddleware` /
       * `authenticateToken`. Optional because middleware is applied
       * per-route, not globally.
       */
      user?: AuthPayload;
    }

    interface Application {
      /**
       * Typed overload for the global Socket.IO server attached via
       * `app.set('io', io)` in `server.ts`. Lets routes call
       * `req.app.get('io')` without `(req as any)` casts.
       */
      get(name: 'io'): SocketIOServer;
    }
  }
}

/**
 * Historical note — `req.app.get('io')`:
 * Earlier this file documented this overload as deferred. It is now active
 * (see `Application.get('io')` above) so routes can broadcast events with
 * full typing.
 */

export {};
