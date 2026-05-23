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
  }
}

/**
 * NOTE — `req.app.get('io')`:
 *
 * Express's `Application.get(name)` overload returns `any`. To tighten this
 * to a `socket.io` `Server` instance we would need to augment
 * `Express.Application` with an `get('io'): Server` overload AND import the
 * Socket.IO Server type at the type-only level. That import has side
 * effects on the d.ts graph (socket.io brings in @types/node etc.) and is
 * deliberately deferred to a later phase to keep this turn risk-free.
 *
 * Plan (not done this phase):
 *   import type { Server as SocketIOServer } from 'socket.io';
 *   declare global {
 *     namespace Express {
 *       interface Application {
 *         get(name: 'io'): SocketIOServer;
 *       }
 *     }
 *   }
 */

export {};
