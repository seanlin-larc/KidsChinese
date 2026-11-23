import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toZhuyin, toToneMarked } from '../js/pinyin.js';

const CASES = [
  ['ba4', 'ㄅㄚˋ', 'bà'], ['ma5', '˙ㄇㄚ', 'ma'], ['lao3', 'ㄌㄠˇ', 'lǎo'],
  ['nv3', 'ㄋㄩˇ', 'nǚ'], ['lv4', 'ㄌㄩˋ', 'lǜ'], ['ju2', 'ㄐㄩˊ', 'jú'],
  ['jue2', 'ㄐㄩㄝˊ', 'jué'], ['xue3', 'ㄒㄩㄝˇ', 'xuě'], ['qu4', 'ㄑㄩˋ', 'qù'],
  ['xiong2', 'ㄒㄩㄥˊ', 'xióng'], ['yong3', 'ㄩㄥˇ', 'yǒng'], ['yun4', 'ㄩㄣˋ', 'yùn'],
  ['zhi1', 'ㄓ', 'zhī'], ['shi2', 'ㄕˊ', 'shí'], ['ri4', 'ㄖˋ', 'rì'], ['zi3', 'ㄗˇ', 'zǐ'],
  ['ci2', 'ㄘˊ', 'cí'], ['si1', 'ㄙ', 'sī'], ['chi3', 'ㄔˇ', 'chǐ'],
  ['jiu4', 'ㄐㄧㄡˋ', 'jiù'], ['gui1', 'ㄍㄨㄟ', 'guī'], ['lun2', 'ㄌㄨㄣˊ', 'lún'],
  ['you2', 'ㄧㄡˊ', 'yóu'], ['wen1', 'ㄨㄣ', 'wēn'], ['wu3', 'ㄨˇ', 'wǔ'], ['yi2', 'ㄧˊ', 'yí'],
  ['er3', 'ㄦˇ', 'ěr'], ['an1', 'ㄢ', 'ān'], ['e4', 'ㄜˋ', 'è'], ['bo2', 'ㄅㄛˊ', 'bó'],
  ['shuo1', 'ㄕㄨㄛ', 'shuō'], ['huang2', 'ㄏㄨㄤˊ', 'huáng'], ['zhong1', 'ㄓㄨㄥ', 'zhōng'],
  ['xiao3', 'ㄒㄧㄠˇ', 'xiǎo'], ['qian1', 'ㄑㄧㄢ', 'qiān'], ['ying2', 'ㄧㄥˊ', 'yíng'],
  ['yue4', 'ㄩㄝˋ', 'yuè'], ['yuan2', 'ㄩㄢˊ', 'yuán'], ['kuai4', 'ㄎㄨㄞˋ', 'kuài'],
  ['zui3', 'ㄗㄨㄟˇ', 'zuǐ'], ['tou2', 'ㄊㄡˊ', 'tóu'], ['hou2', 'ㄏㄡˊ', 'hóu'],
];

test('pinyin converts to Zhuyin and tone marks', () => {
  for (const [input, zy, py] of CASES) {
    assert.equal(toZhuyin(input), zy, `${input} zhuyin`);
    assert.equal(toToneMarked(input), py, `${input} pinyin`);
  }
});

test('bad syllables throw', () => {
  for (const bad of ['lao', 'xx3', 'zho1', 'lao6', '']) {
    assert.throws(() => toZhuyin(bad), `${bad} should throw`);
  }
});
