Vue 3 + TypeScript: よくある型チェックエラーと修正方法
Vue 3にTypeScriptで取り組む際、Options APIとComposition APIの両方で初心者～中級者が遭遇しやすい型チェックエラーの例と、その原因および修正方法をまとめます。各セクションではエラーメッセージ例、原因の説明、間違ったコード例、修正後のコード例を示します。
Props の型定義エラー
VueコンポーネントのProps定義で、型指定の誤りから型チェックエラーが発生することがあります。以下に代表的な例を示します。
例1: リテラル型が正しく適用されないエラー
エラーメッセージ例:
Type 'string' is not assignable to type 'Stuff | undefined'.
stackoverflow.com
 原因:
Composition APIのdefinePropsで、リテラル型を伴う独自の型（例えばStuffが'item' | 'box' | 'area'のユニオン型）をPropType経由で指定した場合、TypeScriptが期待通りに型を絞り込めず、渡した文字列リテラルが汎用のstring型として扱われてしまうことがあります。その結果、上記エラーのようにstringが期待されたリテラル型（Stuff）に割り当てられないという型不一致が報告されます
stackoverflow.com
。 間違ったコード例:
ts
コピーする
編集する
// Composition API - defineProps の誤った使用例
type Stuff = 'item' | 'box' | 'area';

const props = defineProps({
  // Props定義で PropType を使用したが型が絞り込まれないケース
  kind: { type: String as PropType<Stuff> },  // TS上は kind: Stuff | undefined と推論
  placeholder: String
});

// 親コンポーネント側
<MyComponent kind={myStringVar} />  // myStringVar が string 型だとエラー
修正後のコード例:
ts
コピーする
編集する
// Composition API - defineProps を型引数で使用する
type Stuff = 'item' | 'box' | 'area';
const props = defineProps<{
  kind?: Stuff;        // 「undefined」を含めた型にするか、オプショナルプロパティにする
  placeholder?: string;
}>();

// あるいは runtime 定義でも直接型を指定
// kind: { type: Stuff as PropType<Stuff> } は不可 → 以下のように union 型を直接指定
const props = defineProps({
  kind: { type: ['item','box','area'] as const },  // 3.3以降はリテラルの tuple で型定義可能
  placeholder: String
});
上記のように型引数でdefinePropsを使用することで、リテラル型Stuffが正しく適用され、例えばkind="item"といった文字列を渡しても型エラーになりません
stackoverflow.com
（Vue 3.3+ではオブジェクト構文より型引数構文の方が安定しています
stackoverflow.com
stackoverflow.com
）。また、オプショナルなPropは?を付けるかrequired: falseにして、値を渡さない場合でもエラーにならないようにします。
例2: オプショナルPropsが必須とみなされるエラー
エラーメッセージ例:
text
コピーする
編集する
Type '{ sources: string[]; autoSlide: number; controls: true; pages: true; "client:only": string; }' 
is not assignable to type '...{ readonly sources: any; readonly height: string|number; readonly width: string|number; readonly autoSlide: number; readonly transitionTime: number; readonly controls: boolean; readonly pages: boolean; }'. 
Type '{ ... }' is missing the following properties from type '{ ... }': height, width, transitionTime:contentReference[oaicite:5]{index=5}.
原因:
オプショナルなPropsを定義したつもりでも、型推論上は必須になってしまい、親側で省略するとエラーになるケースです。上記メッセージでは、height, width, transitionTimeを渡していないため「missing the following properties...」と指摘されています
stackoverflow.com
。これはVue 3.2以前でオブジェクト構文のdefinePropsを用いた場合などに発生しやすい問題です。TypeScriptの型システムがOptionalを正しく認識しておらず、すべてのPropが必須とみなされています。 間違ったコード例:
ts
コピーする
編集する
// Props 定義（オブジェクト構文、オプショナルなつもりだが…）
const props = defineProps({
  sources: { type: Array as PropType<string[]>, required: true },
  height: { type: [Number, String], default: 400 },    // defaultがあるのでオプショナルのはず
  width:  { type: [Number, String], default: 900 },    // 同上
  autoSlide: { type: Number, default: 0 },             // 同上
  transitionTime: { type: Number, default: 0.4 },      // 同上
  controls: Boolean,  // default: false (暗黙的)
  pages: Boolean      // default: false
});
vue
コピーする
編集する
<!-- 親コンポーネントで height 等を省略して使用 -->
<MyComponent sources="..." autoSlide="2000" controls pages />
上記のコードではheight,width等を渡していないため、エラーメッセージにあるようにTSが「プロパティheight, width, transitionTimeが存在しない」と判断しています。 修正後のコード例:
ts
コピーする
編集する
// Props 定義を型引数構文で記述し、オプショナルを適切に扱う
interface MyProps {
  sources: string[];         // 必須プロパティ
  height?: string | number;  // ?: を付けてオプショナルに
  width?: string | number;
  autoSlide?: number;
  transitionTime?: number;
  controls?: boolean;
  pages?: boolean;
}
const props = defineProps<MyProps>();  // 型引数で定義
このようにオプショナルなPropsは?を付けた型で宣言し、defineProps<MyProps>()のように型ベースで定義すると、渡していないPropsはundefinedとして扱われるため型エラーが解消します
stackoverflow.com
。型引数構文を使うと、デフォルト値は別途withDefaultsで設定できます（この場合型上必須→オプショナルへの変換も自動で処理されます）
vuejs.org
vuejs.org
。
Emits の型エラー
カスタムイベントの型定義も、Options API/Composition API双方でつまずきやすいポイントです。主なエラーと解決策を紹介します。
例: defineEmitsの型指定ミスによるエラー
エラーメッセージ例:
TS2349: This expression is not callable. Type 'Emits' has no call signatures
stackoverflow.com
 原因:
Composition APIでdefineEmitsに型引数を与える際、その型の書き方を誤ると、emit関数を呼び出せなくなります。初心者が陥りがちなのは、イベント名とペイロードをプロパティとして持つインターフェースを定義してdefineEmits<Events>とするパターンです
stackoverflow.com
。例えば下記のようにしてしまうと、TypeScriptはEmitsインターフェースを呼び出しシグネチャを持たないオブジェクト型と解釈し、emit('event')の呼び出しで上記エラーを出します
stackoverflow.com
。 間違ったコード例:
ts
コピーする
編集する
// 間違ったEmits型の定義例
export interface Emits {
  submit: string;  // イベント名をキーにしたプロパティ（誤り）
}

const emit = defineEmits<Emits>();
emit('submit', 'hello');  // TSエラー: emitが呼び出せない
修正後のコード例:
ts
コピーする
編集する
// 正しいEmits型の定義：呼び出しシグネチャを持つ関数型リテラル
const emit = defineEmits<{
  (e: 'submit', message: string): void;
}>();

emit('submit', 'hello');  // 型チェックOK
defineEmitsの型引数には**「イベント名とペイロードを表す関数シグネチャ」**を指定します
stackoverflow.com
。上記修正例では、イベント名'submit'とペイロードstringをとり返り値無し(void)の関数型を型引数に渡しています。こうすることで、emit('submit', 'hello')の呼び出しが型安全になり、存在しないイベント名や誤った型のペイロードを渡すとエラーになるようになります
vuejs.org
vuejs.org
。 補足: Options APIの場合、コンポーネントオプションのemitsプロパティでオブジェクトを使って型定義できます。例えばemits: { submit: (msg: string) => true }のように書けば、emit('submit', msg)でmsgはstring型であることがチェックされます
vuejs.org
。
ref / reactive の型推論エラー
リアクティブ変数を扱う際、型推論やref特有の性質によって生じるエラーがあります。
例1: refに代入する値の型不一致
エラーメッセージ例:
TS Error: Type 'string' is not assignable to type 'number'.
vuejs.org
 原因:
ref()で作成した変数は初期値から型が推論されます。例えばconst year = ref(2020)と書くとyearはRef<number>型になります
vuejs.org
。このときyear.valueに文字列を代入すると、推論された型（number）に一致しないためエラーになります
vuejs.org
。TypeScriptの静的解析が、リアクティブ変数への誤った値の代入を検出しているのです。 間違ったコード例:
ts
コピーする
編集する
import { ref } from 'vue';
const year = ref(2020);      // year: Ref<number>
year.value = '2020';         // エラー: string を number に代入しようとした
修正後のコード例:
ts
コピーする
編集する
year.value = 2020;           // number型のまま代入すればOK

// あるいは year をユニオン型にする
const year2 = ref<string | number>('2020');
year2.value = 2020;          // string|number 型なら両方代入可能
基本的に**refには一貫した型の値を保持させる**ようにし、必要なら最初からユニオン型やジェネリクスで許容する型を指定します
vuejs.org
vuejs.org
。例えば上記のようにref<string|number>('2020')とすれば、後で数値を代入してもエラーになりません。
例2: refを直接演算・プロパティアクセスしてしまうエラー
エラーメッセージ例:
TS Error: Property 'split' does not exist on type 'number'
vuejs.org
 原因:
Composition APIのrefは.valueプロパティに中身を保持します。しかしテンプレート上では.valueを介さず変数そのものを使えるという特殊仕様があるため、混乱が生じることがあります。例えば以下のケースでは、doubleはcomputedで計算されたRef<number>ですが、コード上でdouble.valueを取り出さず文字列メソッドを呼んでしまっています。その結果、TypeScriptはdouble.value（number型）に対して.split()メソッドが無いとエラーを出します
vuejs.org
。 間違ったコード例:
ts
コピーする
編集する
import { ref, computed } from 'vue';
const count = ref(0);
const double = computed(() => count.value * 2); 
// doubleはComputedRef<number> 型（中身は number）

const result = double.value.split(''); 
// エラー: numberにstringのsplitメソッドは無い:contentReference[oaicite:24]{index=24}
修正後のコード例:
ts
コピーする
編集する
const result = String(double.value).split(''); 
// 文字列に変換してからsplitを呼ぶ、もしくは

const text = computed(() => String(count.value * 2));
const result2 = text.value.split(''); 
// computedの中で文字列化しておく方法もOK
このエラーはRefの中身の型を誤って扱ったことによるものです。対策として、例えば文字列操作をしたい場合は上記のようにString(...)で明示的に変換するか、computedの計算段階で目的の型に揃えておきます。 また、同様にrefを直接演算に使おうとしてエラーになるケースもあります。例えばconst count = ref(0); const total = count + 1;と書くと、countはRef<number>なので数値ではなくオブジェクトであり、「演算子'+'を適用できない型である」というエラーになります（Ref<number>型とnumber型の演算は不可）。この場合もcount.value + 1とすべきです。Composition APIのスクリプト中では**.valueの付け忘れ**がないよう注意し、エラーになった場合はRef型と実値型を取り違えていないか確認してください。
例3: reactiveで定義したオブジェクトに存在しないプロパティを追加
エラーメッセージ例:
TS Error: Object is possibly 'undefined'.
masteringpinia.com
 原因:
PiniaやVuexの状態管理、あるいは単純なreactiveオブジェクトで初期値にプロパティが無い場合、そのプロパティにアクセスすると型的にはundefinedの可能性が指摘されます。例えばPiniaの例で、userオブジェクトを最初undefinedにしておくと（const user = ref()など）、user.value.idにアクセスする箇所で「オブジェクトはundefinedの可能性があります」というエラーが出ます
masteringpinia.com
。同様に、reactive({})で空のオブジェクトを作り動的にプロパティを追加しようとすると、「存在しないプロパティにアクセスしている」というエラーになります。 間違ったコード例:
ts
コピーする
編集する
// Piniaの例: 初期状態で user が空オブジェクト
const user = ref();  // any 型か undefined 型のRefになる

function updateAvatar(url: string) {
  fetch('/api/user/' + user.value.id, {  // user.value が undefined かもしれない
    method: 'PATCH',
    body: JSON.stringify({ url })
  });
}
// → TS Error: Object is possibly 'undefined'.:contentReference[oaicite:27]{index=27}
修正後のコード例:
ts
コピーする
編集する
// 1. user を適切に初期化しておく（オブジェクトの形を揃える）
interface User { id: number; name: string; /* ... */ }
const user = ref<User | null>(null); 

async function updateAvatar(url: string) {
  if (!user.value) return;                  // nullチェックを入れる
  await fetch(`/api/user/${user.value.id}`, { /* ... */ });
}

// 2. もしくは初期値として空オブジェクトを「型断言」せず用意する
const user2 = ref<User>({ id: 0, name: '' }); 
// ※仮の初期値（型安全ではあるが、0や空文字といったダミー値を置く方法）
解決策としては初期値をできる限り適切に設定し、型上undefinedを含まないようにするか、nullを含む型にしてアクセス時にガード処理を入れることです。上の例ではuserをUser | null型にしてnullチェックしています。型断言で無理にエラーを消すこと（例: const user = ref({} as User) のような「とりあえず{}はUser型だと言い張る」方法
masteringpinia.com
）は、型安全性を損なうので避けましょう。 また、reactiveで最初に空オブジェクトを入れておき、後からプロパティを追加するのも推奨されません。この場合は最初から必要なプロパティを持つオブジェクトを初期化するか、reactiveの型をインターフェースで定義しておくとよいでしょう
vuejs.org
。
Computed プロパティでの型エラー
Computedプロパティに関連する型エラーもいくつかあります。既に前述の例でもComputedでのエラーを扱いましたが、ここではOptions APIの場合も含め補足します。
例: Computedの戻り値型と利用方法の不一致
Options APIではcomputedプロパティの戻り値型を明示できますが、誤ると型エラーになります。また、Composition APIではcomputedはRefと似たオブジェクト（ComputedRef<T>）を返すため、その扱いを誤るとエラーが出ます。 エラーメッセージ例: （Composition APIでの例）
TS Error: Property 'split' does not exist on type 'number'
vuejs.org
 ※ 前述のComputedRefの例と同じエラーです。この他にも、「computedの戻り値が期待する型と違う」といったエラーが起こり得ます。 原因:
Composition APIでは先述の通り、computedの結果に対し.valueで取り出した型に合わない操作をするとエラーになります
vuejs.org
。Options APIでは、例えば以下のようにcomputedのゲッターで戻り値の型注釈を間違えるケースがあります。 間違ったコード例（Options APIの例）:
ts
コピーする
編集する
export default defineComponent({
  props: { count: Number },
  computed: {
    doubled(): string {         // 本当は number を返すべきなのに string と注釈
      return this.count * 2;    // count * 2 は number型 -> string型に代入しようとしてエラー
    }
  }
});
上記ではdoubledの型をstringと書いてしまったため、実際の計算結果numberとの不整合でエラーになります。 修正後のコード例:
ts
コピーする
編集する
computed: {
  doubled(): number {          // 正しく number とする
    return this.count * 2;
  }
}
または型注釈を省略すれば、戻り値から自動推論されます。 Composition APIの場合は、computedの戻りを直接使う時には型を意識しましょう。たとえばconst text = computed(() => count.value.toString())のようにしておけば、text.valueは文字列型となり、文字列用メソッドを使ってもエラーになりません。要はcomputedの中で必要な型に変換しておくか、computed結果の.valueを取り出してから適切に処理することが大切です。 なお、Vue 3のtemplate内ではrefやcomputedは自動的にアンラップ（.valueせずに中身を参照可能）されます。しかしIDEや型チェックツールの設定によっては、ComputedRef<モデル型>のプロパティアクセスでエラーが出ることがあります。その場合はVue 3用の公式プラグイン（Volar）を使用することで解決できます
reddit.com
。
フォームバインディングにおける型の不一致エラー
v-modelやフォーム入力と双方向バインディングする際にも、型不一致によるエラーが発生します。
例: v-modelでの型ミスマッチ
エラーメッセージ例:
Type 'string | number | null | undefined' is not assignable to type 'Nullable<string>'. Type 'number' is not assignable to type 'Nullable<string>'.
stackoverflow.com
 原因:
通常、HTMLのテキスト入力(<input type="text">)はユーザー入力を文字列として扱います。しかし、バインドしているデータが数値型の場合、TypeScript上で「文字列型/数値型の不一致」が発生します。上記メッセージは、PrimeVueの<InputText>コンポーネントの例ですが、本質的には「モデル値がコンポーネントの期待する型と合わない」ことを示しています
stackoverflow.com
。具体的には、InputTextは内部でmodelValue?: string（Nullable<string>）を要求するのに、こちらがnumberを渡そうとしたためエラーになっています。 間違ったコード例:
vue
コピーする
編集する
<template>
  <!-- membership.id は number 型だが、InputText は string を期待 -->
  <InputText v-model="membership.id" />  
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
const membershipStore = useMembershipStore();
const { membership } = storeToRefs(membershipStore);
// membership.value.id は number | undefined 型
</script>
上記ではmembership.value.id（ピニアストアからの取得値）が数値型であるのに、<InputText>は文字列型を期待するためエラーとなります。 修正後のコード例:
vue
コピーする
編集する
<template>
  <!-- 数値型には InputNumber コンポーネントを利用 -->
  <InputNumber v-model="membership.id" />
  <!-- あるいは、文字列入力に揃える場合、バインディング前に toString する -->
  <InputText v-model="membershipIdString" />
</template>

<script setup lang="ts">
const membershipStore = useMembershipStore();
const { membership } = storeToRefs(membershipStore);

// 方法1: 数値専用のコンポーネントに切り替える
// 方法2: 文字列プロパティを用意して双方向バインドし、必要に応じて数値に変換
import { computed } from 'vue';
const membershipIdString = computed({
  get: () => membership.value.id?.toString() || '',
  set: val => { 
    if (membership.value) membership.value.id = Number(val);
  }
});
</script>
対策として、Vue 3標準のフォーム入力であれば修飾子を使う方法があります。例えば数値入力なら<input v-model.number="age">のように.number修飾子を付けると、自動的に文字列→数値変換され、ageがnumber型でもエラーになりにくくなります（Volar等もこの変換を考慮します）。カスタムコンポーネントの場合は、上記のように適切なコンポーネントを使い分けるか、computedを使って文字列と数値を仲介する方法があります。 また、select要素でmultipleを使う場合など、v-modelの型が配列（例えばstring[]）になることもあります。この場合も型を正確に合わせる必要があります。例えばroles: (string|number)[]にv-modelバインドしているのに、HTMLの<select multiple>の型定義上はstring[] | undefinedだったりするとエラーになります
reddit.com
。このときは配列要素の型を統一する（全て文字列にするか数値にする）か、型キャストで対応することになります。
Vuex や Pinia を使用する際の型関連の問題
状態管理ライブラリ(Vuex/Pinia)をTypeScriptで使うとき、型定義を適切にしないとエラーが生じます。
例1: Vuexストアへの型情報不足によるエラー
エラーメッセージ例:
TS2339: Property '$store' does not exist on type 'ComponentPublicInstance<...>'
stackoverflow.com
 原因:
VuexをVue 3 + TypeScriptで使う場合、デフォルトではthis.$storeの型がanyもしくは存在しないものとして扱われます。Vueコンポーネントのインスタンス型にカスタムプロパティ$storeが定義されていないため、「$storeは存在しないプロパティだ」というエラーになるのです
stackoverflow.com
。これはVuex側が型定義を提供していないためで、開発者が補強する必要があります。 間違ったコード例:
ts
コピーする
編集する
// store/index.ts
import { createStore } from 'vuex';
export interface State { count: number }
export default createStore<State>({ 
  state: { count: 0 }
  // ...getters, mutationsなど
});

// コンポーネント.vue
export default defineComponent({
  computed: {
    doubleCount(): number {
      return this.$store.state.count * 2; 
      // エラー: this.$store が型上存在しない:contentReference[oaicite:38]{index=38}
    }
  }
});
修正後のコード例:
ts
コピーする
編集する
// vuex.d.ts - 型宣言ファイルをプロジェクトに追加
import { ComponentCustomProperties } from 'vue'
import { Store } from 'vuex'
import type { State } from '@/store'  // 上記State型をインポート

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
上記のようにモジュール拡張宣言を行い、ComponentCustomPropertiesに$storeの型を追加することで、this.$storeを使った際に型が認識され、エラーが解消します
stackoverflow.com
。Vue CLIで作成したプロジェクトではshims-vue.d.tsにまとめて書く例もありますが、どこかの.d.tsに書いておけば型システムが認識します。
例2: Piniaの状態がRefでラップされている場合の扱い
エラーメッセージ例:
Property 'length' does not exist on type '{ [RefSymbol]: true; }'.
cloud.tencent.com
 原因:
Piniaではstateの中でref()やuseStorage(VueUse)を使うと、そのプロパティはRefオブジェクトになります。PiniaはVuexと異なり、リアクティブなrefをそのまま状態として保持できますが、そのままでは中身を取り出すのに.valueが必要です。上記メッセージは、例えばthis.fooが実はRef<Foo[]>であるのに、それに対して直接.lengthプロパティをアクセスしようとしている状況です
cloud.tencent.com
cloud.tencent.com
。TypeScriptはthis.fooの型をRef型とみなすため、.lengthが存在しないとエラーになります。 間違ったコード例:
ts
コピーする
編集する
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
interface Job { /* ... */ }

export const useJobStore = defineStore('job', {
  state: () => ({
    jobs: useStorage('jobs', [] as Job[]) 
    // jobs は Ref<Job[]> 型になります
  }),
  actions: {
    getCount() {
      return this.jobs.length; 
      // エラー: jobs は Refオブジェクトなので length が無い:contentReference[oaicite:43]{index=43}
    }
  }
});
修正後のコード例:
ts
コピーする
編集する
getCount() {
  return this.jobs.value.length;  // .valueで中身の配列を取り出してからlengthを使う
}
このようにRefでラップされた値は.value経由でアクセスする必要があります
cloud.tencent.com
。PiniaのstateはProxyラップされているため、一見this.jobsで中身にアクセスできそうですが、実際には上記のようなケースでは手動で.valueを付ける必要がある点に注意してください。
例3: Piniaの初期状態におけるundefined問題
Piniaの状態で先述のようにnullやundefinedを扱うと型エラーになるケースもあります。例えば、const user = ref<User>()のように初期値を省略するとRef<User|undefined>となり、コンポーネントでstore.user.nameを使った場合に「userがundefinedの可能性がある」と警告されます。これも適切に初期値を与えるか、undefinedをハンドリングする条件を加えることで解決できます（前述の「Object is possibly 'undefined'」の例を参照）。
テンプレート内で発生しやすい型エラー
テンプレート（.vueファイルのtemplateセクション）内でも型チェックが行われ、いくつか典型的なエラーがあります。
例1: v-forのキーにオブジェクトを使った際の警告
エラーメッセージ例（警告メッセージ）:
[Vue warn]: Avoid using non-primitive value as key, use string/number value instead
stackoverflow.com
 原因:
Vueのv-forで:keyにオブジェクトや配列など非プリミティブな値を使うと、ランタイムで警告されます。これは型エラーではなくコンソール警告ですが、初心者が見落としやすいポイントです。keyには一意の識別子としてプリミティブ値（文字列もしくは数値）を使う必要があります。例えば<div v-for="item in list" :key="item">と書いてitemオブジェクト自体をキーにすると、上記のような警告が出ます
stackoverflow.com
。 間違ったコード例:
vue
コピーする
編集する
<template>
  <ul>
    <li v-for="item in users" :key="item">
      {{ item.name }}
    </li>
  </ul>
</template>
（usersの各要素がオブジェクトである場合、:key="item.id"等とすべきところを直接itemにしている） 修正後のコード例:
vue
コピーする
編集する
<li v-for="item in users" :key="item.id"> ... </li>
もしくはユニークな文字列が無ければインデックスでも良いですが、推奨は一意のIDを使うことです（インデックスは要素の並び替えで不安定になるため開発者ツール上で警告されることがあります）。 上記警告はテンプレート内での誤りですが、TypeScriptの型エラーではないため、エディタ上で赤線が出るタイプのエラーではありません。しかしコンソールに警告が表示され、キーの不適切な使用はバグの元になるため、見逃さないようにしましょう。
例2: その他テンプレートでの型エラー
存在しないプロパティへのアクセス: テンプレート内でfoo.barと書いたが、fooがオブジェクトではなく文字列だった場合など、型不一致があればIDEプラグイン（Volar）がエラーを示します。たとえばComponentのPropsにない変数をテンプレートで使った場合「プロパティXXは存在しない型…」というエラーが出ます。これは単純にテンプレートで利用する値やメソッドは必ずセットアップで定義・返却することで解決します。
v-model関連: こちらも前述のフォームバインディングの型ミスマッチがテンプレート上でハイライトされます。テンプレート内のエラー表示を一時的に回避するために// @ts-ignoreコメントを使うこともできますが
stackoverflow.com
、根本解決には正しい型定義を行うことが重要です。
ディレクティブの修飾子: 例えばカスタムコンポーネントに対するv-modelでは、modelValueとupdate:modelValueイベントを正しく型定義しないとテンプレート上でエラーになります。コンポーネント側で definePropsとdefineEmitsを適切に設定しましょう。
以上、Vue 3 + TypeScript開発で遭遇しやすい型チェックエラーの代表例とその修正方法を紹介しました。実際のエラーメッセージや原因を理解し、適切に型定義やコード修正を行うことで、型エラーを解消しつつ型安全なVueアプリケーション開発を進められます。 参考文献・情報源:
Vue公式ドキュメント「TypeScriptとVue 3」
vuejs.org
vuejs.org
vuejs.org
vuejs.org
スタックオーバーフローのQ&A
stackoverflow.com
stackoverflow.com
stackoverflow.com
stackoverflow.com
stackoverflow.com
Pinia公式ブログ記事
masteringpinia.com
masteringpinia.com
その他関連情報
cloud.tencent.com
stackoverflow.com
など