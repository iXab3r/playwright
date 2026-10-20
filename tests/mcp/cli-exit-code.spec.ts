/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crypto from 'crypto';
import fs from 'fs';
import net from 'net';
import path from 'path';

import { test as baseTest, expect } from './cli-fixtures';
import { makeSocketPath } from '../../packages/playwright-core/lib/server/utils/fileUtils';
import { SocketConnection } from '../../packages/playwright-core/lib/tools/utils/socketConnection';

type DaemonResponse = { result?: { text: string, isError?: boolean }, error?: string };

const test = baseTest.extend<{ daemonResponse: DaemonResponse }>({
  daemonResponse: async ({ cliEnv }, use, testInfo) => {
    const response: DaemonResponse = {};
    const socketPath = makeSocketPath('cli-exit', crypto.randomUUID());
    const server = net.createServer(socket => {
      const connection = new SocketConnection(socket);
      connection.onmessage = async ({ id }) => {
        await connection.send({ id, ...response });
      };
    });
    await new Promise<void>(resolve => server.listen(socketPath, resolve));
    const daemonDir = path.join(cliEnv.PLAYWRIGHT_DAEMON_SESSION_DIR, 'test');
    await fs.promises.mkdir(daemonDir, { recursive: true });
    await fs.promises.writeFile(path.join(daemonDir, 'default.session'), JSON.stringify({
      name: 'default',
      version: require('../../packages/playwright-core/package.json').version,
      workspaceDir: testInfo.outputDir,
      socketPath,
    }));
    await use(response);
    await new Promise<void>(resolve => server.close(() => resolve()));
  },
});

for (const raw of [false, true]) {
  const flags = raw ? ['--raw'] : [];
  const suffix = raw ? ' --raw' : '';

  for (const diagnostic of ['Error: script failed', 'TimeoutError: locator.click: Timeout 100ms exceeded.']) {
    test(`tool failure sets exit status: ${diagnostic}${suffix}`, async ({ cli, daemonResponse }) => {
      const text = raw ? diagnostic : `### Error\n${diagnostic}`;
      daemonResponse.result = { isError: true, text };
      const { output, exitCode } = await cli('run-code', '() => {}', ...flags);
      expect(output).toBe(text);
      expect(exitCode).toBe(1);
    });
  }

  test(`successful result keeps exit status${suffix}`, async ({ cli, daemonResponse }) => {
    const text = '### Error\nThis is successful tool output, not a failure.';
    daemonResponse.result = { text };
    const { output, exitCode } = await cli('run-code', '() => {}', ...flags);
    expect(output).toBe(text);
    expect(exitCode).toBe(0);
  });
}

test('transport failure keeps nonzero exit status', async ({ cli, daemonResponse }) => {
  daemonResponse.error = 'Session transport failed';
  const { error, exitCode } = await cli('run-code', '() => {}');
  expect(error).toContain('Session transport failed');
  expect(exitCode).toBe(1);
});
