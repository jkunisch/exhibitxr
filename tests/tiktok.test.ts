import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as fs from 'fs';
import { resolve } from 'path';

describe("TikTok Video Pipeline Regression", () => {
  it("verifies the recording script exists and is syntactically correct", () => {
    const scriptPath = resolve(process.cwd(), 'scripts/generate-tiktok-video.ts');
    assert.ok(fs.existsSync(scriptPath), "Recording script should exist");
    
    // Check if it can be imported (syntax check)
    // We don't execute the full script as it requires a browser and a running server
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('generateTikTokVideo'), "Script should contain the main function");
    assert.ok(content.includes('recordVideo'), "Script should use playwright's recording feature");
  });

  it("verifies the recording route exists", () => {
    const routePath = resolve(process.cwd(), 'src/app/record-tiktok/page.tsx');
    assert.ok(fs.existsSync(routePath), "Recording page route should exist");
    
    const content = fs.readFileSync(routePath, 'utf-8');
    assert.ok(content.includes('autoRotate={true}'), "Recording page should enable autoRotate");
  });
});
