
import * as assert from 'assert';
import { KeywordService } from '../../services/keywordService';

suite('With Keyword Service', () => {
    let keywordService: KeywordService;
    setup(() => {
        keywordService = KeywordService.getInstance();
    });
    test('gets 2 classBuiltIn Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["classBuiltIn"]);
        assert.strictEqual(keywords.length, 2);
    });
    test('gets 20 constant Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["constant"]);
        assert.strictEqual(keywords.length, 23);
    });
    test('gets 43 declaration Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["declaration"]);
        assert.strictEqual(keywords.length, 43);
    });
    test('gets 1 event-handler Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["event-handler"]);
        assert.strictEqual(keywords.length, 1);
    });
    test('gets 8 eventType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["eventType"]);
        assert.strictEqual(keywords.length, 8);
    });
    test('gets 182 function Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["function"]);
        assert.strictEqual(keywords.length, 182);
    });
    test('gets 7 functionType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["functionType"]);
        assert.strictEqual(keywords.length, 7);
    });
    test('gets 4 inputType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["inputType"]);
        assert.strictEqual(keywords.length, 4);
    });
    test('gets 3 functionModifier Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["functionModifier"]);
        assert.strictEqual(keywords.length, 3);
    });
    test('gets 6 variableModifier Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["variableModifier"]);
        assert.strictEqual(keywords.length, 6);
    });
    test('gets 3 parameterModifier Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["parameterModifier"]);
        assert.strictEqual(keywords.length, 3);
    });
    test('gets 4 outputType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["outputType"]);
        assert.strictEqual(keywords.length, 4);
    });
    test('gets 5 parameterType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["parameterType"]);
        assert.strictEqual(keywords.length, 5);
    });
    test('gets 16 statement Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["statement"]);
        assert.strictEqual(keywords.length, 15);
    });
    test('gets 5 structureBuiltIn Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["structureBuiltIn"]);
        assert.strictEqual(keywords.length, 5);
    });
    test('gets 1 type Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["type"]);
        assert.strictEqual(keywords.length, 1);
    });
    test('gets 10 variable Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["variable"]);
        assert.strictEqual(keywords.length, 10);
    });
    test('gets 6 variableType Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["variableType"]);
        assert.strictEqual(keywords.length, 6);
    });
    test('gets 33 voidFunction Keywords', () => {
        const keywords = keywordService.getKeywordsByType(["voidFunction"]);
        assert.strictEqual(keywords.length, 35);
    });
});