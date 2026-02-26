import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ExhibitModelSchema } from '../src/types/schema';

describe('3D Pipeline & Schema Regression', () => {
  it('should validate ExhibitModel with the new thumbnailUrl', () => {
    const validData = {
      id: 'test-123',
      label: 'Test Model',
      glbUrl: 'https://example.com/model.glb',
      usdzUrl: 'https://example.com/model.usdz',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: []
    };

    const result = ExhibitModelSchema.safeParse(validData);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.thumbnailUrl, 'https://example.com/thumb.jpg');
    }
  });

  it('should still work without optional thumbnailUrl (Backward Compatibility)', () => {
    const legacyData = {
      id: 'legacy-123',
      label: 'Legacy Model',
      glbUrl: 'https://example.com/model.glb',
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: []
    };

    const result = ExhibitModelSchema.safeParse(legacyData);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.thumbnailUrl, undefined);
    }
  });

  it('should fail on invalid URL for thumbnailUrl', () => {
    const invalidData = {
      id: 'bad-123',
      label: 'Bad Model',
      glbUrl: 'https://example.com/model.glb',
      thumbnailUrl: 'not-a-url',
      scale: 1,
      position: [0, 0, 0],
      variants: [],
      hotspots: []
    };

    const result = ExhibitModelSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
  });
});
