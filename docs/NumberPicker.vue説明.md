# NumberPicker.vue 説明

このコンポーネントは、数独の数字入力に使われるボタンパッドのような役割を果たします。

## 🔧 主な目的

- 1〜9 の数字をボタンで表示し、ユーザーが選択できるようにする
- × ボタンでクリア（0）を選択可能にする
- 選ばれた数字を親コンポーネントに emit（イベント通知）する

## 🔍 テンプレート部（`<template>`）

```html
<div class="number-picker">
  <button v-for="n in 9" :key="n" @click="$emit('pick', n)" class="num-btn">
    {{ n }}
  </button>
  <button @click="$emit('pick', 0)" class="num-btn clear">×</button>
</div>
```

- `v-for="n in 9"`：1～9のボタンをループ生成
- `@click="$emit('pick', n)"`：数字ボタンをクリックすると、pick イベントが親に通知される
- × ボタンは 0 を渡すことで「クリア操作」になる（0 = 未入力）

## 💬 スクリプト部（`<script setup lang="ts">`）

```ts
const emits = defineEmits<{
  (e: "pick", n: number): void;
}>();
```

- defineEmits により、イベント名 pick と型 number（0～9）を指定
- 型安全に `emit('pick', n)` を使えるようにしている

## 🎨 スタイル部（`<style scoped>`）

```css
.number-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}
.num-btn {
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
}
.clear {
  color: red;
}
```

- 数字ボタンを横に並べ、間隔を `gap: 4px` で調整
- 各ボタンの大きさは 32x32px
- clear クラスは赤色で視認性を高めている（削除ボタンであることを示す）

## ✅ 使用例（親コンポーネントで）

```vue
<NumberPicker @pick="handlePick" />

<script setup lang="ts">
function handlePick(n: number) {
  // 例: セルに n を設定、n === 0 なら削除
}
</script>
```

## 📌 総括

| 項目   | 内容                                    |
| ------ | --------------------------------------- |
| 用途   | 数独の数字入力（1〜9）およびクリア（×） |
| イベント | pick イベントで親に値を渡す              |
| 拡張性 | 候補の強調、無効化（disabled）、アイコン対応など拡張可能 |

---