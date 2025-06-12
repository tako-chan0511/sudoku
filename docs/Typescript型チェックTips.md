Vue 3 + TypeScript: よくある型チェックエラーと修正方法
Vue 3にTypeScriptで取り組む際、Options APIとComposition APIの両方で初心者～中級者が遭遇しやすい型チェックエラーの例と、その原因および修正方法をまとめます。

Props の型定義エラー
例1: リテラル型が正しく適用されないエラー
エラーメッセージ例:

Code
Type 'string' is not assignable to type 'Stuff | undefined'.
原因: Composition APIのdefinePropsで、リテラル型を伴う独自の型（例:Stuffが'item' | 'box' | 'area'のユニオン型）をPropType経由で指定した場合、型が正しく絞り込まれない。

間違ったコード例:

ts
type Stuff = 'item' | 'box' | 'area';

const props = defineProps({
  kind: { type: String as PropType<Stuff> },  // TS上は kind: Stuff | undefined と推論
  placeholder: String
});

// 親コンポーネント側
<MyComponent kind={myStringVar} />  // myStringVar が string 型だとエラー
修正後のコード例:

ts
type Stuff = 'item' | 'box' | 'area';
const props = defineProps<{
  kind?: Stuff;
  placeholder?: string;
}>();

// あるいは runtime 定義でも直接型を指定
const props = defineProps({
  kind: { type: ['item','box','area'] as const },
  placeholder: String
});
型引数でdefinePropsを使用することで、リテラル型Stuffが正しく適用されます。

例2: オプショナルPropsが必須とみなされるエラー
エラーメッセージ例:

Code
Type '{ sources: string[]; autoSlide: number; controls: true; pages: true; "client:only": string; }'
is not assignable to type '{ ... }'
Type '{ ... }' is missing the following properties from type '{ ... }': height, width, transitionTime
原因: オプショナルなPropsを定義したつもりでも、型推論上は必須になってしまい、親側で省略するとエラーになる。

間違ったコード例:

ts
const props = defineProps({
  sources: { type: Array as PropType<string[]>, required: true },
  height: { type: [Number, String], default: 400 },
  width:  { type: [Number, String], default: 900 },
  autoSlide: { type: Number, default: 0 },
  transitionTime: { type: Number, default: 0.4 },
  controls: Boolean,
  pages: Boolean
});
修正後のコード例:

ts
interface MyProps {
  sources: string[];
  height?: string | number;
  width?: string | number;
  autoSlide?: number;
  transitionTime?: number;
  controls?: boolean;
  pages?: boolean;
}
const props = defineProps<MyProps>();
型引数構文を使うと、デフォルト値はwithDefaultsで設定可能です。

Emits の型エラー
例: defineEmitsの型指定ミスによるエラー
エラーメッセージ例:

Code
TS2349: This expression is not callable. Type 'Emits' has no call signatures
間違ったコード例:

ts
export interface Emits {
  submit: string;  // イベント名をキーにしたプロパティ（誤り）
}
const emit = defineEmits<Emits>();
emit('submit', 'hello');  // TSエラー
修正後のコード例:

ts
const emit = defineEmits<{
  (e: 'submit', message: string): void;
}>();
emit('submit', 'hello');  // 型チェックOK
defineEmitsの型引数には「イベント名とペイロードを表す関数シグネチャ」を指定します。

ref / reactive の型推論エラー
例1: refに代入する値の型不一致
間違ったコード例:

ts
import { ref } from 'vue';
const year = ref(2020);      // year: Ref<number>
year.value = '2020';         // エラー
修正後のコード例:

ts
year.value = 2020;           // number型のまま
const year2 = ref<string | number>('2020');
year2.value = 2020;          // 両方代入可能
例2: refを直接演算・プロパティアクセスしてしまうエラー
間違ったコード例:

ts
import { ref, computed } from 'vue';
const count = ref(0);
const double = computed(() => count.value * 2);
const result = double.value.split('');
// エラー: numberにstringのsplitメソッドは無い
修正後のコード例:

ts
const result = String(double.value).split('');
// または
const text = computed(() => String(count.value * 2));
const result2 = text.value.split('');
例3: reactiveで定義したオブジェクトに存在しないプロパティを追加
間違ったコード例:

ts
const user = ref();  // any 型か undefined 型のRefになる
function updateAvatar(url: string) {
  fetch('/api/user/' + user.value.id, {  // user.value が undefined かもしれない
    method: 'PATCH',
    body: JSON.stringify({ url })
  });
}
修正後のコード例:

ts
interface User { id: number; name: string; }
const user = ref<User | null>(null);

async function updateAvatar(url: string) {
  if (!user.value) return;
  await fetch(`/api/user/${user.value.id}`, { /* ... */ });
}

// または
const user2 = ref<User>({ id: 0, name: '' });
初期値を明示する、またはnullチェックを入れましょう。

Computed プロパティでの型エラー
間違ったコード例（Options APIの例）:

ts
export default defineComponent({
  props: { count: Number },
  computed: {
    doubled(): string {         // 本当は number を返すべきなのに string
      return this.count * 2;
    }
  }
});
修正後のコード例:

ts
computed: {
  doubled(): number {          // 正しく number とする
    return this.count * 2;
  }
}
フォームバインディングにおける型の不一致エラー
間違ったコード例:

Vue
<template>
  <InputText v-model="membership.id" />  <!-- membership.id は number 型 -->
</template>
<script setup lang="ts">
const { membership } = storeToRefs(useMembershipStore());
</script>
修正後のコード例:

Vue
<template>
  <InputNumber v-model="membership.id" />
  <InputText v-model="membershipIdString" />
</template>
<script setup lang="ts">
const { membership } = storeToRefs(useMembershipStore());
const membershipIdString = computed({
  get: () => membership.value.id?.toString() || '',
  set: val => { if (membership.value) membership.value.id = Number(val); }
});
</script>
Vuex や Pinia を使用する際の型関連の問題
例1: Vuexストアへの型情報不足によるエラー
間違ったコード例:

ts
import { createStore } from 'vuex';
export interface State { count: number }
export default createStore<State>({ 
  state: { count: 0 }
});

export default defineComponent({
  computed: {
    doubleCount(): number {
      return this.$store.state.count * 2; // エラー
    }
  }
});
修正後のコード例:

ts
import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'
import type { State } from '@/store'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
例2: Piniaの状態がRefでラップされている場合の扱い
間違ったコード例:

ts
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
interface Job { /* ... */ }

export const useJobStore = defineStore('job', {
  state: () => ({
    jobs: useStorage('jobs', [] as Job[])
  }),
  actions: {
    getCount() {
      return this.jobs.length; // エラー
    }
  }
});
修正後のコード例:

ts
getCount() {
  return this.jobs.value.length;
}
例3: Piniaの初期状態におけるundefined問題
const user = ref<User>()のように初期値を省略するとRef<User|undefined>型となり、テンプレートで型エラーが出ることがあります。

テンプレート内で発生しやすい型エラー
例1: v-forのキーにオブジェクトを使った際の警告
間違ったコード例:

Vue
<template>
  <ul>
    <li v-for="item in users" :key="item">
      {{ item.name }}
    </li>
  </ul>
</template>
修正後のコード例:

Vue
<li v-for="item in users" :key="item.id"> ... </li>
例2: その他テンプレートでの型エラー
存在しないプロパティへのアクセス
v-model関連（型ミスマッチ）
ディレクティブの修飾子とイベント名・型の不一致
参考リンク
Vue公式ドキュメント「TypeScriptとVue 3」
Stack Overflow
Pinia公式ブログ記事
cloud.tencent.com
以上、Vue 3 + TypeScript開発で遭遇しやすい型チェックエラーの代表例とその修正方法でした。