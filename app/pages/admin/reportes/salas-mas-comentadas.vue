<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-7xl mx-auto mb-6" role="banner">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="flex items-center gap-3 flex-1">
          <RouterLink to="/admin/reportes">
            <Button
              icon="pi pi-arrow-left"
              label="Volver"
              size="small"
              aria-label="Volver a reportes"
            />
          </RouterLink>
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
              Salas con más comentarios
            </h1>
            <p class="text-slate-600 text-sm">
              Monitorea las salas que concentran más comentarios y revisa cada reseña en detalle.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            icon="pi pi-file-pdf"
            label="Ver PDF"
            severity="danger"
            :loading="pdfLoading"
            :disabled="pdfLoading || !cinemaOptions.length"
            @click="generatePdf"
          />
          <Button
            icon="pi pi-refresh"
            label="Limpiar resultados"
            severity="secondary"
            :disabled="(!commentStats.length && !reviews.length) && !filtersApplied"
            @click="resetAll"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            :loading="loading"
            :disabled="loading || !cinemaOptions.length"
            @click="runReport"
          />
        </div>
      </div>
    </header>

    <section class="max-w-7xl mx-auto mb-6" aria-label="Filtros del reporte">
      <div class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Cine *
            </label>
            <Dropdown
              v-model="form.cinemaId"
              :options="cinemaOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un cine"
              class="w-full"
              :loading="cinemasLoading"
              :disabled="cinemasLoading || !cinemaOptions.length"
              filter
              filterPlaceholder="Buscar cine..."
            />
            <p v-if="errors.cinemaId" class="mt-1 text-sm text-red-600">
              {{ errors.cinemaId }}
            </p>
            <p v-else-if="!cinemasLoading && !cinemaOptions.length" class="mt-1 text-sm text-slate-500">
              No se encontraron cines registrados.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Sala (opcional)
            </label>
            <Dropdown
              v-model="form.roomId"
              :options="roomOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas las salas del cine"
              class="w-full"
              :loading="roomsLoading"
              :disabled="roomsDisabled"
              :showClear="!!form.roomId"
              filter
              filterPlaceholder="Buscar sala..."
            />
            <p v-if="selectedCinemaId && !roomsLoading && !roomOptions.length" class="mt-1 text-sm text-slate-500">
              Este cine no tiene salas registradas.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Desde * (fecha)
            </label>
            <Calendar
              v-model="form.startDate"
              class="w-full"
              dateFormat="yy-mm-dd"
              iconDisplay="input"
              placeholder="Selecciona fecha inicial"
            />
            <p v-if="errors.startDate" class="mt-1 text-sm text-red-600">
              {{ errors.startDate }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Hasta * (fecha)
            </label>
            <Calendar
              v-model="form.endDate"
              class="w-full"
              dateFormat="yy-mm-dd"
              iconDisplay="input"
              placeholder="Selecciona fecha final"
            />
            <p v-if="errors.endDate" class="mt-1 text-sm text-red-600">
              {{ errors.endDate }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <main class="max-w-7xl mx-auto space-y-4" role="main">
      <div
        v-if="lastQuerySummary"
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        <div>
          <p class="text-xs uppercase text-slate-500 tracking-wide">Cine seleccionado</p>
          <p class="text-lg font-semibold text-slate-900">{{ lastQuerySummary.cinemaName }}</p>
          <p class="text-sm text-slate-600">
            {{ lastQuerySummary.roomName || "Todas las salas" }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase text-slate-500 tracking-wide">Periodo</p>
          <p class="text-sm text-slate-700">
            {{ formatDisplayDate(lastQuerySummary.startDate) }} → {{ formatDisplayDate(lastQuerySummary.endDate) }}
          </p>
          <div class="mt-3">
            <p class="text-xs uppercase text-slate-500 tracking-wide">Comentarios listados</p>
            <p class="text-xl font-semibold text-slate-900">{{ reviews.length }}</p>
          </div>
          <div class="mt-3" v-if="mostCommentedRoom">
            <p class="text-xs uppercase text-slate-500 tracking-wide">Sala destacada</p>
            <p class="text-sm font-semibold text-slate-900">
              {{ mostCommentedRoom?.roomName || "—" }} ·
              {{ formatNumber(mostCommentedRoom?.reviewCount) }} comentarios
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-white shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Salas más comentadas</h2>
              <p class="text-sm text-slate-600">
                Ranking de salas según la cantidad de comentarios recibidos.
              </p>
            </div>
            <Button
              icon="pi pi-refresh"
              text
              severity="secondary"
              :disabled="!commentStats.length"
              @click="clearCommentStats"
            />
          </div>
          <DataTable
            :value="commentStats"
            dataKey="roomName"
            :loading="loading"
            tableStyle="min-width: 48rem"
            stripedRows
          >
            <Column header="#" style="width: 4rem">
              <template #body="{ index }">
                <span class="font-mono text-sm text-slate-500">{{ index + 1 }}</span>
              </template>
            </Column>
            <Column field="roomName" header="Sala">
              <template #body="{ data }">
                <span class="font-semibold text-slate-800">{{ data.roomName || "—" }}</span>
              </template>
            </Column>
            <Column field="reviewCount" header="Comentarios">
              <template #body="{ data }">
                <span class="font-semibold">{{ formatNumber(data.reviewCount) }}</span>
              </template>
            </Column>
            <template #empty>
              <div class="py-8 text-center text-slate-500">
                No hay datos para mostrar todavía.
              </div>
            </template>
          </DataTable>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
          <DataTable
            :value="reviews"
            dataKey="createdAt"
            :loading="loading"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            tableStyle="min-width: 60rem"
            stripedRows
            rowHover
          >
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm text-slate-600">
                  {{ reviews.length }} comentarios listados.
                </span>
                <Button
                  icon="pi pi-times"
                  label="Limpiar tabla"
                  severity="secondary"
                  text
                  :disabled="!reviews.length"
                  @click="clearResults"
                />
              </div>
            </template>
            <Column field="clientEmail" header="Cliente">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-medium text-slate-800">{{ data.clientEmail || "—" }}</span>
                  <span class="text-xs text-slate-500">{{ formatDisplayDateTime(data.createdAt) }}</span>
                </div>
              </template>
            </Column>
            <Column field="roomName" header="Sala">
              <template #body="{ data }">
                <span class="font-semibold text-slate-800">{{ data.roomName || "—" }}</span>
              </template>
            </Column>
            <Column field="comment" header="Comentario">
              <template #body="{ data }">
                <p class="text-sm text-slate-700 whitespace-pre-line">
                  {{ data.comment || "Sin comentario" }}
                </p>
              </template>
            </Column>
            <template #empty>
              <div class="py-10 text-center text-slate-500">
                No hay comentarios para los filtros seleccionados.
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </main>

    <PdfViewerModal
      v-model="showPdf"
      :blob="pdfBlob"
      title="Reporte de salas con más comentarios"
      file-name="reporte-salas-mas-comentadas.pdf"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { toast } from "vue-sonner";
import PdfViewerModal from "~/components/common/PdfViewerModal.vue";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getAllCinemas,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";
import {
  getCinemaHallsByCinemaId,
  type CinemaHallResponseDTO,
} from "~/lib/api/cinema/hall";
import {
  topCommentedRoomsReport,
  topCommentedRoomsReportPdf,
  type CommentReportResponse,
  type RoomCommentsStatsResponse,
  type TopCommentedRoomsReportQuery,
} from "~/lib/api/reportes/reportes";

const form = reactive<{
  cinemaId: string | null;
  roomId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}>({
  cinemaId: null,
  roomId: null,
  startDate: null,
  endDate: null,
});

const errors = reactive<{
  cinemaId: string | null;
  startDate: string | null;
  endDate: string | null;
}>({
  cinemaId: null,
  startDate: null,
  endDate: null,
});

const commentStats = ref<RoomCommentsStatsResponse[]>([]);
const reviews = ref<CommentReportResponse[]>([]);
const loading = ref(false);
const pdfLoading = ref(false);
const pdfBlob = ref<Blob | null>(null);
const showPdf = ref(false);
const lastQuerySummary = ref<{
  cinemaName: string;
  roomName?: string | null;
  startDate: string;
  endDate: string;
} | null>(null);

const filtersApplied = computed(
  () => !!form.roomId || !!form.startDate || !!form.endDate
);

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
} = useCustomQuery({
  key: ["top-commented-rooms-cinemas"],
  query: async () => {
    return getAllCinemas();
  },
});

const cinemaOptions = computed<Array<{ label: string; value: string }>>(() =>
  ((cinemasState.value.data ?? []) as CinemaResponseDTO[]).map((cinema) => ({
    label: cinema.name,
    value: cinema.id,
  }))
);

const cinemasLoading = computed(() => cinemasStatus.value === "loading");

watch(
  cinemaOptions,
  (options) => {
    if (!options.length) {
      form.cinemaId = null;
      return;
    }
    if (!form.cinemaId || !options.some((opt) => opt.value === form.cinemaId)) {
      form.cinemaId = options[0].value;
    }
  },
  { immediate: true }
);

const selectedCinemaId = computed(() => form.cinemaId?.trim() || null);

const {
  state: hallsState,
  asyncStatus: hallsStatus,
} = useCustomQuery({
  key: ["top-commented-rooms-halls", () => selectedCinemaId.value || "none"],
  query: async () => {
    const id = selectedCinemaId.value;
    if (!id) return [];
    return getCinemaHallsByCinemaId(id);
  },
});

const roomOptions = computed<Array<{ label: string; value: string }>>(() =>
  ((hallsState.value.data ?? []) as CinemaHallResponseDTO[]).map((hall) => ({
    label: hall.name,
    value: hall.id,
  }))
);

const roomsLoading = computed(() => hallsStatus.value === "loading");
const roomsDisabled = computed(
  () => !selectedCinemaId.value || roomsLoading.value
);

watch(
  roomOptions,
  (options) => {
    if (!form.roomId) return;
    if (!options.some((option) => option.value === form.roomId)) {
      form.roomId = null;
    }
  },
  { immediate: true }
);

function toDateString(date: Date | null) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validateForm() {
  const cinemaValue = typeof form.cinemaId === "string" ? form.cinemaId.trim() : "";
  errors.cinemaId = cinemaValue ? null : "Selecciona un cine.";
  errors.startDate = form.startDate ? null : "Selecciona una fecha inicial.";
  errors.endDate = form.endDate ? null : "Selecciona una fecha final.";

  if (!errors.startDate && !errors.endDate && form.startDate && form.endDate) {
    if (form.startDate > form.endDate) {
      errors.endDate = "La fecha final debe ser posterior a la inicial.";
    }
  }

  return !errors.cinemaId && !errors.startDate && !errors.endDate;
}

function buildQuery(): TopCommentedRoomsReportQuery | null {
  if (!validateForm()) return null;
  const payload: TopCommentedRoomsReportQuery = {
    startDate: toDateString(form.startDate)!,
    endDate: toDateString(form.endDate)!,
  };
  const roomValue = typeof form.roomId === "string" ? form.roomId.trim() : "";
  if (roomValue) {
    payload.roomId = roomValue;
  }
  return payload;
}

async function runReport() {
  const query = buildQuery();
  if (!query) return;

  loading.value = true;
  pdfBlob.value = null;
  try {
    const response = await topCommentedRoomsReport(query);
    commentStats.value = response.commentStats ?? [];
    reviews.value = response.reviews ?? [];
    lastQuerySummary.value = {
      cinemaName: selectedCinemaLabel.value || "—",
      roomName: selectedRoomLabel.value,
      startDate: query.startDate,
      endDate: query.endDate,
    };
    if (!commentStats.value.length && !reviews.value.length) {
      toast.info("No se encontraron datos para los filtros seleccionados.");
    }
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo obtener el reporte de salas.";
    toast.error(message);
  } finally {
    loading.value = false;
  }
}

function resetAll() {
  form.roomId = null;
  form.startDate = null;
  form.endDate = null;
  errors.cinemaId = null;
  errors.startDate = null;
  errors.endDate = null;
  clearResults();
}

function clearResults() {
  commentStats.value = [];
  reviews.value = [];
  lastQuerySummary.value = null;
  pdfBlob.value = null;
  showPdf.value = false;
}

function clearCommentStats() {
  commentStats.value = [];
}

const selectedCinemaLabel = computed(() => {
  return cinemaOptions.value.find((opt) => opt.value === form.cinemaId)?.label || null;
});

const selectedRoomLabel = computed(() => {
  if (!form.roomId) return null;
  return roomOptions.value.find((opt) => opt.value === form.roomId)?.label || null;
});

const mostCommentedRoom = computed<RoomCommentsStatsResponse | null>(() => {
  if (!commentStats.value.length) return null;
  return commentStats.value.reduce<RoomCommentsStatsResponse>((best, current) => {
    if (current.reviewCount === best.reviewCount) {
      return current;
    }
    return current.reviewCount > best.reviewCount ? current : best;
  }, commentStats.value[0]);
});

function formatDisplayDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return value;
  }
}

function formatDisplayDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return value;
  }
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-GT").format(value);
}

async function generatePdf() {
  const query = buildQuery();
  if (!query) return;

  pdfLoading.value = true;
  try {
    const blob = await topCommentedRoomsReportPdf(query);
    if (!blob?.size) {
      toast.info("No se generó información para el PDF con los filtros actuales.");
      return;
    }
    pdfBlob.value = blob;
    showPdf.value = true;
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo generar el PDF del reporte.";
    toast.error(message);
  } finally {
    pdfLoading.value = false;
  }
}
</script>
