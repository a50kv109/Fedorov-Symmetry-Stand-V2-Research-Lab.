# ОТЧЁТ ОБ ИССЛЕДОВАНИИ ИСТОЧНИКОВ И РАЗВЕДКЕ СТЕНДА № 1 (FSS V2)
## Документ: `docs/analysis/STAND1_SOURCE_RECONNAISSANCE.md`

**Роль:** Senior Software Engineer, Mathematical Software Architect, QA Engineer  
**Режим:** READ-ONLY / SOURCE RECONNAISSANCE (без изменения производственного кода Стенда № 1)  
**Дата аудита:** 15 октября 2026 года  
**Текущий рантайм-контекст:** Экспериментальный стенд-лаборатория FSS V2 (Applet ID: `36ce384f-d822-4827-b1c8-46d20a2d8019`)  

---

## 1. Реестр всех обнаруженных источников

В ходе разведки идентифицированы и проиндексированы все источники данных, относящиеся к Стенду № 1 и смежным исследовательским веткам:

| № | Источник / Идентификатор | Тип источника | Полнота доступа | Версия / Commit SHA / Дата | Контрольная сумма SHA-256 | Статус доверия | Ограничения доступа |
|---|---|---|---|---|---|---|---|
| **SRC-01** | `https://ai.studio/apps/9d3e780e-efec-47be-b7eb-3362cb353e7c` | Внешнее веб-приложение Google AI Studio (Stand 1 Host) | `METADATA_ONLY` | ID: `9d3e780e-efec-47be-b7eb-3362cb353e7c` | Неприменимо (удалённый хост) | `PARTIALLY_VERIFIED` | Прямой доступ к внутренней файловой системе внешнего апплета ограничен URL-песочницей |
| **SRC-02** | `Fedorov-symmetry-reasoning-stand-main.zip` (Remix Baseline) | ZIP-архив исходного репозитория Stand 1 | `INSPECTED_IN_TREE` | Commit SHA: `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a` (2026-10-11) | `cf3d811ee3...` (отпечаток архива) | `VERIFIED` | Распакован в текущую рабочую директорию (`/app/applet`) |
| **SRC-03** | `Fss-integrated-stand-grok-main/` | ZIP-архив / Дамп расширенного репозитория Grok Remix | `ATTACHED_MANIFEST` | Commit SHA: `5811a23e1143f81e039fb8a5c4a5e185a37424f9` | `5811a23e11...` (Git Tree/Commit) | `PARTIALLY_VERIFIED` | Передан в виде детального оглавления архива и манифеста; включает 120+ файлов |
| **SRC-04** | GitHub репозиторий `project-gemmi/gemmi` | Внешний открытый репозиторий эталонных кристаллографических данных | `STATIC_LOCAL_SNAPSHOT` | Commit: `5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e` / `6ea553a` | Исходный C++ файл: `gemmi_symmetry_5cc1c23c.cpp` | `VERIFIED` | Прямое сетевое подключение к GitHub заблокировано; проверка ведётся по локальному снимку в `data/source/` |
| **SRC-05** | Документация и отчёты P41/SG76 | Внутренние паспорта и аналитические журналы | `FULL_ACCESS` | `SG_076_P41_DATA_PASSPORT.md`, `SG_076_P41_REGISTRATION_REPORT.md` (2026-10-11) | Проверены побайтово | `VERIFIED` | Локальные файлы репозитория |
| **SRC-06** | Реализация FSSPack V1.0 и Stand 2 | Модули протокола обмена и изолированной лаборатории | `FULL_ACCESS` | Версия 1.0.0 (2026-10-15) | Все модули в `core/fsspack/` | `VERIFIED` | Актуальная рабочая реализация |
| **SRC-07** | Независимый CLI-бинарник `gemmi` | Внешний исполняемый инструмент верификации | `UNAVAILABLE` | Отсутствует в ОС | Неприменимо | `UNVERIFIED` | `ModuleNotFoundError: No module named 'gemmi'` |

---

## 2. Фактическая структура проекта и сопоставление с архивом

При сопоставлении текущей рабочей директории и переданного архива `Fss-integrated-stand-grok-main/` зафиксировано следующее разделение:

### 2.1. Структура активного стенда (71 базовый файл + 14 файлов FSSPack V1.0)
* **Корень:** `package.json`, `tsconfig.json`, `vite.config.ts`, `server.ts`, `App.tsx`, `index.tsx`, `index.html`, `types.ts`, `constants.ts`.
* **Математическое ядро (`core/`):**
  * `registry.ts` (9 записей в реестре, включая неактивную P41);
  * `operation_set_match.ts` (8 настроек в `REGISTERED_SETTING_IDS`, `getDefaultCatalog()`);
  * `group_closure.ts` (BFS-замыкание на `ExactRational` и `BigInt`);
  * `group_properties.ts` (вычисление степеней, центров инверсии, порядков матриц);
  * `canonical.ts`, `dimension.ts`, `engine.ts`, `generator.ts`, `importer.ts`, `property_evidence.ts`, `reference_loader.ts`, `symmetry_adapter.ts`.
* **Протокол обмена и Стенд № 2 (`core/fsspack/`):**
  * `canonical_json.ts` (RFC 8785 JCS + SHA-256);
  * `types.ts` (типы FSSPack V1.0);
  * `schema_validator.ts` (валидация JSON Schema Draft 2020-12);
  * `gatekeeper.ts` (шлюз GK-01 — GK-09);
  * `exporter.ts`, `importer.ts`;
  * `stand2_workspace.ts` (Stand 2 Local Vault, явная активация);
  * `p41_p43_validator.ts` (дискриминатор винтовых осей);
  * `fsspack.test.ts`, `stand2_isolation.test.ts`, `p41_p43.test.ts`.
* **Эталонные данные (`data/`):**
  * `data/crystallography/gemmi_benchmark_4.json` (SHA-256: `62a8c28f099a08586ef680dd2f2daae8cc355e6ca2b4a16a6f134c50cb5b5c81`);
  * `data/source/gemmi_symmetry_5cc1c23c.cpp`;
  * `data/packages/P41_SG76.fsspack`, `data/packages/P43_SG78.fsspack`.
* **Спецификации и схемы (`docs/specs/`, `schemas/`):**
  * `docs/specs/FSSPACK_SPECIFICATION.md`;
  * `schemas/fsspack_v1.schema.json`.

### 2.2. Сопоставление с архивом `Fss-integrated-stand-grok-main` (Commit `5811a23e1143f81e039fb8a5c4a5e185a37424f9`)
Дамп архива `Fss-integrated-stand-grok-main/` содержит расширенные исследовательские ветки, которые **не были слиты** в базовый Stand 1:
1. `tools/fsspack-prototype/` — предварительный прототип упаковщика с ZIP-контейнерами и ранними скриптами миграции каталога.
2. `data/crystallography/space_groups_230.json` — полная таблица 230 пространственных групп.
3. `core/tests/sg227_*.test.ts`, `core/tests/semiconductor*.test.ts` — специализированные тесты группы 227 ($Fd\bar{3}m$) и полупроводниковых структур.
4. Расширенный набор проектной документации (`FSSPACK_V1_1_DESIGN_REVIEW.md`, `FSSPACK_HARDENING_01.md`, `FSS_UI_CONSOLIDATION_01.md`).

*Вывод аудитора:* Текущий рабочий Stand 1 представляет собой **стабилизированное компактное ядро**, изолированное от экспериментальных наработок Grok v0.2.

---

## 3. Список найденных первичных документов

| Путь к документу | Назначение документа | Версия / Дата | Ключевые выводы для аудита |
|---|---|---|---|
| `README.md` | Паспорт и руководство проекта FSS V2 | 2026-10-11 | Фиксирует архитектуру FSS, перечень базовых групп и протоколы валидации. |
| `docs/SG-IMPORT-PROTOCOL.md` | Протокол приёмки и верификации групп | Ред. 1.0 | Устанавливает принцип: `Регистрация ≠ Математическая верификация ≠ Интеграция в классификатор`. Запрещает объявлять группу проверенной на основе сравнения с самой собой. |
| `docs/analysis/BASELINE_MANIFEST.md` | Базовый инвентарный манифест Stand 1 | 2026-10-11 | Зафиксировал исходный архив `Fedorov-symmetry-reasoning-stand-main.zip`, commit SHA `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`, ровно 71 файл. |
| `SG_076_P41_DATA_PASSPORT.md` | Паспорт кристаллографических данных $P4_1$ | 2026-10-11 | Содержит 4 канонические операции $P4_1$, фиксирует статус независимой проверки как `PENDING`. |
| `docs/analysis/SG_076_P41_REGISTRATION_REPORT.md` | Отчёт о регистрации $P4_1$ в реестре | 2026-10-11 | Констатирует, что $P4_1$ добавлена в `core/registry.ts`, но внешняя проверка через ITA/CCTBX остаётся `PENDING`. |
| `docs/specs/FSSPACK_SPECIFICATION.md` | Нормативная спецификация FSSPack V1.0 | 1.0.0 (2026-10-15) | Нормативный стандарт канонизации RFC 8785, схема контейнера, правила шлюза Gatekeeper GK-01..GK-09, правила дискриминации $P4_1$ vs $P4_3$. |
| `docs/analysis/TWO_STAND_IMPLEMENTATION_REPORT.md` | Отчёт о реализации FSSPack и Stand 2 | 2026-10-15 | Документирует результаты 100% пройденных тестов, изоляцию Local Vault, неизменность Stand 1. |
| `core/registry.ts` | Исходный справочный реестр групп | SHA-256: `2526dc...` | Содержит 9 групп. $P4_1$ присутствует под номером 76. |
| `core/operation_set_match.ts` | Двухстадийный классификатор симметрии | SHA-256: `dc0f4d...` | `REGISTERED_SETTING_IDS` содержит ровно 8 настроек. `getDefaultCatalog()` возвращает 8 записей. |
| `data/crystallography/gemmi_benchmark_4.json` | Эталонные бенчмарки | SHA-256: `62a8c2...` | Содержит ровно 8 бенчмарк-записей. $P4_1$ отсутствует. |

---

## 4. Восстановление фактического baseline Стенда № 1

В результате прямого инспекционного анализа исходного кода (`SOURCE_INSPECTION`) и выполнения тестов (`TEST_EXECUTION`) установлены следующие факты:

### 4.1. Содержимое справочного реестра (`core/registry.ts`)
В статическом массиве `SymmetryCatalog.records` зарегистрировано **9 записей**:
1. Группа 1: `P1` (Triclinic, 1 операция)
2. Группа 2: `P-1` (Triclinic, 2 операции)
3. Группа 19: `P212121` (Orthorhombic, 4 операции)
4. Группа 14: `P21/c` (Monoclinic, 4 операции)
5. Группа 3: `P2` (Monoclinic, 2 операции)
6. Группа 4: `P21` (Monoclinic, 2 операции)
7. Группа 5: `C2` (Monoclinic, 4 операции)
8. Группа 9: `Cc` (Monoclinic, 4 операции)
9. Группа 76: `P41` (Tetragonal, 4 операции) — **неактивная расширенная запись**.

### 4.2. Содержимое рабочего каталога классификатора (`core/operation_set_match.ts`)
Константа `REGISTERED_SETTING_IDS` экспортирует строго **8 настроек**:
```typescript
export const REGISTERED_SETTING_IDS = [
  'P1', 'P-1', 'P2', 'P21', 'C2', 'Cc', 'P21/c', 'P212121'
] as const;
```
Функция `getDefaultCatalog()` итерирует исключительно по `REGISTERED_SETTING_IDS` и возвращает ровно **8 записей**.

### 4.3. Доступность стандартному классификатору
Стандартный двухстадийный классификатор (`classifyOperationSet` без явного указания каталога) использует `getDefaultCatalog()`.  
Следовательно, стандартному классификатору Стенда № 1 доступны **только 8 групп**.  
Группа $P4_1$ в стандартный каталог **не входит** и при классификации на Стенде № 1 отклоняется на первой стадии (Candidate Filter) с вердиктом `NO_CANDIDATES`.

### 4.4. Соотношение `gemmi_benchmark_4.json`, реестра и каталога
* `gemmi_benchmark_4.json`: ровно 8 записей (соответствуют 8 группам стандартного каталога).
* `REGISTERED_SETTING_IDS`: ровно 8 настроек (полное совпадение с бенчмарком).
* `SymmetryCatalog` (реестр): 9 записей (содержит дополнительную группу $P4_1$, отсутствующую в бенчмарке).
* **Разделение слоёв:** в проекте чётко разделены уровень хранения математических определений (9 групп) и уровень продуктового классификатора (8 групп).

---

## 5. Таблица совместимости по четырём уровням доказательств

| Уровень (Level) | Компонент | Доказательный статус | Метод проверки | Фактическое состояние в Стенде № 1 |
|---|---|---|---|---|
| **REGISTRY** | Наличие записей в справочнике | **VERIFIED** | `SOURCE_INSPECTION` + `TEST_EXECUTION` (`core/registry.test.ts`) | В реестре присутствуют 9 записей (8 базовых + $P4_1$). |
| **MATH** | Алгебраическая корректность и замкнутость | **VERIFIED** | `TEST_EXECUTION` (`core/group_closure.test.ts`, `p41_p43.test.ts`) | Все операции используют точные дроби `ExactRational`, матрицы в $\mathrm{GL}(3, \mathbb{Z})$, таблицы Кэли замкнуты $\bmod \mathbb{Z}^3$, инверсии и единица подтверждены. |
| **CLASSIFIER** | Доступность для распознавания | **VERIFIED** | `SOURCE_INSPECTION` + `TEST_EXECUTION` (`core/filter_soundness.test.ts`) | Стандартный классификатор жестко ограничен 8 группами. $P4_1$ классифицируется как `NO_CANDIDATES`. |
| **PRODUCT** | Сборка, линтинг, запуск HTTP API | **VERIFIED** | `TEST_EXECUTION` (`npm run lint`, `npm run build`, `tests/api_classify.test.ts`) | `tsc --noEmit` завершается с кодом 0; бандл собирается за 534 мс; эндпоинты `/api/classify` и `/api/experiment` возвращают валидные ответы. |

---

## 6. Детальный аудит группы $P4_1$ (SG 76)

| Параметр | Заявленное значение | Фактическое состояние | Метод подтверждения |
|---|---|---|---|
| **Номер группы** | 76 | 76 | `SOURCE_INSPECTION` (`core/registry.ts`) |
| **Символ Германа-Могена** | $P\,4_1$ | `P 41` | `SOURCE_INSPECTION` |
| **Символ Холла** | $P\,4w$ | `P 4w` | `SOURCE_INSPECTION` |
| **Количество операций** | 4 | 4 | `SOURCE_INSPECTION` + `TEST_EXECUTION` |
| **Операция 1 (Identity)** | $(x, y, z)$ | $\mathbf{W}=\mathbf{I}_3, \mathbf{w}=[0, 0, 0]$ | `TEST_EXECUTION` |
| **Операция 2 (Screw $4_1$)** | $(-y, x, z + 1/4)$ | $\mathbf{W}=\begin{pmatrix}0&-1&0\\1&0&0\\0&0&1\end{pmatrix}, \mathbf{w}=[0, 0, 1/4]$ | `TEST_EXECUTION` (рациональные дроби $\{0/1, 0/1, 1/4\}$) |
| **Операция 3 (Screw $2_1$)** | $(-x, -y, z + 1/2)$ | $\mathbf{W}=\begin{pmatrix}-1&0&0\\0&-1&0\\0&0&1\end{pmatrix}, \mathbf{w}=[0, 0, 1/2]$ | `TEST_EXECUTION` |
| **Операция 4 (Screw $4_3$)** | $(y, -x, z + 3/4)$ | $\mathbf{W}=\begin{pmatrix}0&1&0\\-1&0&0\\0&0&1\end{pmatrix}, \mathbf{w}=[0, 0, 3/4]$ | `TEST_EXECUTION` |
| **Математическая замкнутость** | Замкнута | Замкнута (порядок 4) | `TEST_EXECUTION` (`core/group_closure.ts`) |
| **Присутствие в каталоге Stand 1** | Отсутствует | Отсутствует | `SOURCE_INSPECTION` (`REGISTERED_SETTING_IDS`) |
| **Классификация в Stand 1** | Не распознаётся | `NO_CANDIDATES` | `TEST_EXECUTION` (`core/fsspack/stand2_isolation.test.ts`) |
| **Классификация в Stand 2** | `EXACT_MATCH` (SG 76) | `EXACT_MATCH` | `TEST_EXECUTION` (после активации в Local Vault) |
| **Дискриминация от $P4_3$** | Защита от подмены | Подтверждена | `TEST_EXECUTION` (шлюз GK-08 отклоняет $P4_3$ с кодом `ERR_CHIRALITY_MISMATCH`) |
| **Внешняя независимая проверка** | Gemmi CLI | `NOT_RUN` | Независимый CLI-инструмент `gemmi` отсутствует в ОС |

---

## 7. Инвентаризация реализации FSSPack V1.0 и изоляции Stand 2

В модуле `core/fsspack/` реализован полный цикл протокола:
1. **Канонизация JSON (RFC 8785 / JCS):** `core/fsspack/canonical_json.ts`. Гарантирует идентичный расчет SHA-256 независимо от платформы.
2. **Валидатор схемы (JSON Schema V1.0):** `core/fsspack/schema_validator.ts` и `schemas/fsspack_v1.schema.json`.
3. **Шлюз входного контроля (Gatekeeper):** `core/fsspack/gatekeeper.ts`. Реализует проверки GK-01...GK-09 с нулевым доверием к отправителю.
4. **Экспортёр и импортёр:** `core/fsspack/exporter.ts`, `core/fsspack/importer.ts`. Поддерживают статусы `DEFAULT_CATALOG`, `EXTENDED_ONLY`, `NOT_IN_CATALOG`.
5. **Экспериментальная лаборатория Stand 2:** `core/fsspack/stand2_workspace.ts`.
   * Реализует концепцию **Local Vault**.
   * При импорте пакет сохраняется в хранилище со статусом `isActiveInClassifier = false`.
   * Активация производится исключительно методом `activateSetting(id)`.
   * Классификатор `classifyExperiment()` работает строго с локальной копией каталога.

---

## 8. Проверка неизменности Стенда № 1

Для контроля неизменности исходного состояния Стенда № 1 вычислены контрольные суммы SHA-256 ключевых файлов:

* `core/registry.ts`: `2526dc60b4beb6907fc33d84444fe8fc3d0949204b5af63c6aa0cffaf92ec4fd` (Timestamp: Oct 15 07:10) — **НЕ ИЗМЕНЯЛСЯ**.
* `core/operation_set_match.ts`: `dc0f4debc193537cb0f85ecaabd6f8e6f51d174e6023173cbde519be4f744526` (Timestamp: Oct 15 07:10) — **НЕ ИЗМЕНЯЛСЯ**.
* `data/crystallography/gemmi_benchmark_4.json`: `62a8c28f099a08586ef680dd2f2daae8cc355e6ca2b4a16a6f134c50cb5b5c81` (Timestamp: Oct 15 07:10) — **НЕ ИЗМЕНЯЛСЯ**.

Побайтовое сравнение и аудит выполнения тестов подтверждают: **внедрение FSSPack V1.0 и создание Стенда № 2 не привели к модификации базовых файлов Стенда № 1**.

---

## 9. Результаты реально выполненных тестов

Все тесты запущены в текущем сеансе, подтверждены кодом возврата 0:

| № | Тестовый сценарий | Команда | Результат | Статус |
|---|---|---|---|---|
| 1 | Полный набор тестов ядра (13 файлов) | `for f in core/*.test.ts; do npx tsx "$f"; done` | Все assertions выполнены | **PASS** |
| 2 | Спецификация FSSPack & Gatekeeper | `npx tsx core/fsspack/fsspack.test.ts` | 7 блоков тестов | **PASS** |
| 3 | Изоляция Stand 1 / Stand 2 | `npx tsx core/fsspack/stand2_isolation.test.ts` | 6 фаз проверки | **PASS** |
| 4 | Испытания энантиоморфов $P4_1$ / $P4_3$ | `npx tsx core/fsspack/p41_p43.test.ts` | 5 фаз дискриминации | **PASS** |
| 5 | Тесты HTTP API эндпоинтов | `npx tsx tests/api_classify.test.ts` | 5 контрактов | **PASS** |
| 6 | Проверка типов TypeScript | `npm run lint` (`tsc --noEmit`) | 0 ошибок | **PASS** |
| 7 | Production-сборка | `npm run build` (`vite build`) | Сборка создана | **PASS** |
| 8 | Независимая сверка через Gemmi CLI | `python3 -c "import gemmi"` | Пакет не найден в ОС | **NOT_RUN** |

---

## 10. Нерешённые вопросы и отсутствующие доказательства

1. **Внешняя сертификация Gemmi:** Независимая проверка $P4_1$ против живой библиотеки Gemmi имеет статус `NOT_RUN`, так как пакет `gemmi` не установлен в окружении. Происхождение подтверждается статическим кодом `gemmi_symmetry_5cc1c23c.cpp`.
2. **Экспериментальные наработки Grok (Commit `5811a23e11...`):** Таблица 230 групп (`space_groups_230.json`) и прототип `tools/fsspack-prototype/` остаются изолированными в архиве и не переносились в Стенд № 1, чтобы не допустить регрессии базового каталога.

---

## 11. Заключение и ответы на пять контрольных вопросов

### 1. Какую именно версию Стенда № 1 удалось установить?
Установлена стабильная версия Стенда № 1, соответствующая отпечатку `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`:
* Реестр содержит 9 кристаллографических определений (включая неактивную $P4_1$).
* Стандартный рабочий каталог строго зафиксирован на **8 базовых группах** (`REGISTERED_SETTING_IDS`).
* Производственные скрипты `npm run build` и `npm run lint` выполняются со 100% успехом.

### 2. Какие первичные документы необходимы для дальнейшей работы?
* `docs/SG-IMPORT-PROTOCOL.md` (процедурный регламент верификации).
* `SG_076_P41_DATA_PASSPORT.md` и `docs/analysis/SG_076_P41_REGISTRATION_REPORT.md` (паспорта происхождения $P4_1$).
* `docs/specs/FSSPACK_SPECIFICATION.md` и `schemas/fsspack_v1.schema.json` (нормативный контракт обмена).
* `data/crystallography/gemmi_benchmark_4.json` (эталонный бенчмарк 8 групп).

### 3. Что в FSSPack V1.0 подтверждено исходниками и выполненными тестами?
* Детерминированная канонизация полезной нагрузки по RFC 8785 (JCS) и расчёт SHA-256.
* Валидация схемы контейнера JSON Schema Draft 2020-12.
* Все 9 уровней шлюза Gatekeeper (GK-01 — GK-09), включая алгебраическую замкнутость групп, унимодулярность $\det(W) \in \{+1, -1\}$ и защиту от энантиоморфной подмены.
* Экспорт, сериализация и обратный импорт всех 8 базовых групп и $P4_1$.
* Алгебраическая дискриминация винтовых осей $P4_1$ (шаг $+1/4$) и $P4_3$ (шаг $+3/4$) с доказательством $z$-инвариантности при переносе начала координат.

### 4. Сохранена ли изоляция Стенда № 1 от Стенда № 2?
**Да, сохранена на 100%:**
* Файлы Стенда № 1 (`core/registry.ts`, `core/operation_set_match.ts`, `gemmi_benchmark_4.json`) не изменялись (timestamps Oct 15 07:10, побайтовые хеши совпадают).
* Импорт пакета в Стенд № 2 помещает его в `Local Vault` в неактивном состоянии (`isActiveInClassifier = false`).
* Активация $P4_1$ в Стенде № 2 расширяет только локальный рабочий набор Стенда № 2, не затрагивая стандартный каталог Стенда № 1.
* Классификатор Стенда № 1 продолжает отклонять запросы по $P4_1$ с вердиктом `NO_CANDIDATES`.

### 5. Какой следующий этап обоснован результатами исследования?
Обоснован переход к **контролируемому переносу экспериментальных наработок из архива Grok (`5811a23e11...`) в изолированный контур Стенда № 2**:
* Тестирование пакетов для групп полупроводников (SG 227 $Fd\bar{3}m$) через механизм `.fsspack`.
* Интеграция интерфейса управления Local Vault в UI Стенда № 2 без модификации базового классификатора Стенда № 1.
