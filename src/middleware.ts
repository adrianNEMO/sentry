/*
 * @rlanz/sentry
 *
 * (c) Romain Lanz
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as SentrySDK from '@sentry/node'
import { Sentry } from './sentry.js'
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SentryMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const client = SentrySDK.getClient()
    const scope = new SentrySDK.Scope()

    scope.setClient(client)
    scope.setTag('url', ctx.request.url())

    ctx.sentry = scope

    // @ts-expect-error - SentrySDK Scope interface seems broken
    ctx.containerResolver.bindValue(Sentry, ctx.sentry)

    await SentrySDK.startSpan(
      {
        name: ctx.routeKey || 'unknown',
        op: 'http.server',
        scope,
      },
      async () => {
        await next()
      }
    )
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    sentry: SentrySDK.Scope
  }
}
