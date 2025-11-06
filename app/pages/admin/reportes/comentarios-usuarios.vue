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
              Comentarios de usuarios por sala
            </h1>
            <p class="text-slate-600 text-sm">
              Consulta los comentarios recibidos en tus salas durante un periodo específico.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <Button
            icon="pi pi-refresh"
            label="Limpiar resultados"
            severity="secondary"
            :disabled="!comments.length && !filtersApplied"
            @click="resetAll"
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            :loading="loading"
            :disabled="companyMissing || loading"
            @click="runReport"
          />
        </div>
      </div>
      <div
        v-if="companyMissing"
        class="mt-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm"
      >
        Tu usuario no tiene una compañía asignada. Solicita a un administrador que configure tu cuenta para poder generar este reporte.
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
              :disabled="companyMissing || cinemasLoading || !cinemaOptions.length"
              :loading="cinemasLoading"
              filter
              filterPlaceholder="Buscar cine..."
            />
            <p v-if="errors.cinemaId" class="mt-1 text-sm text-red-600">
              {{ errors.cinemaId }}
            </p>
            <p v-else-if="!cinemasLoading && !cinemaOptions.length" class="mt-1 text-sm text-slate-500">
              No se encontraron cines asociados a tu compañía.
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
            <p v-if="!roomsLoading && selectedCinemaId && !roomOptions.length" class="mt-1 text-sm text-slate-500">
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
              :disabled="companyMissing"
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
              :disabled="companyMissing"
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
        class="rounded-2xl border border-slate-200 bg-white shadow p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
          <p class="mt-2 text-xs uppercase text-slate-500 tracking-wide">Comentarios encontrados</p>
          <p class="text-xl font-semibold text-slate-900">
            {{ comments.length }}
          </p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow">
        <DataTable
          :value="comments"
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
                {{ comments.length }} comentarios listados.
              </span>
              <Button
                icon="pi pi-times"
                label="Limpiar tabla"
                severity="secondary"
                text
                :disabled="!comments.length"
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
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Calendar from "primevue/calendar";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { toast } from "vue-sonner";
import { useAuthStore } from "~/stores/auth";
import { useCustomQuery } from "~/composables/useCustomQuery";
import {
  getCinemasByCompanyId,
  type CinemaResponseDTO,
} from "~/lib/api/cinema/cinema";
import {
  getCinemaHallsByCinemaId,
  type CinemaHallResponseDTO,
} from "~/lib/api/cinema/hall";
import {
  cinemaAdminCommentReport,
  type CommentReportResponse,
  type UserCommentsReportQuery,
} from "~/lib/api/reportes/reportes";

const authStore = useAuthStore();
const { companyId } = storeToRefs(authStore);

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

const comments = ref<CommentReportResponse[]>([]);
const loading = ref(false);
const lastQuerySummary = ref<{
  cinemaName: string;
  roomName?: string | null;
  startDate: string;
  endDate: string;
} | null>(null);

const companyMissing = computed(() => !companyId.value);
const filtersApplied = computed(
  () => !!form.cinemaId || !!form.roomId || !!form.startDate || !!form.endDate
);

const {
  state: cinemasState,
  asyncStatus: cinemasStatus,
} = useCustomQuery({
  key: ["cinema-comment-report-cinemas", () => companyId.value ?? "none"],
  query: async () => {
    const id = companyId.value?.trim();
    if (!id) return [];
    return getCinemasByCompanyId(id);
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

watch(companyId, () => {
  form.cinemaId = null;
  form.roomId = null;
  comments.value = [];
  lastQuerySummary.value = null;
});

const selectedCinemaId = computed(() => form.cinemaId?.trim() || null);

const {
  state: hallsState,
  asyncStatus: hallsStatus,
  refetch: refetchHalls,
} = useCustomQuery({
  key: ["cinema-comment-report-halls", () => selectedCinemaId.value || "none"],
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
  selectedCinemaId,
  (id, prev) => {
    if (id === prev) return;
    form.roomId = null;
    if (!id) return;
    refetchHalls();
  },
  { immediate: true }
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

  if (companyMissing.value) {
    toast.error("Tu usuario no tiene una compañía asociada.");
    return false;
  }

  return !errors.cinemaId && !errors.startDate && !errors.endDate;
}

function buildQuery(): UserCommentsReportQuery | null {
  if (!validateForm()) return null;
  const payload: UserCommentsReportQuery = {
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
  try {
    const response = await cinemaAdminCommentReport(query);
    comments.value = response;
    lastQuerySummary.value = {
      cinemaName: selectedCinemaLabel.value || "—",
      roomName: selectedRoomLabel.value,
      startDate: query.startDate,
      endDate: query.endDate,
    };
    if (!response.length) {
      toast.info("No se encontraron comentarios para los filtros seleccionados.");
    }
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.message ||
      "No se pudo obtener el reporte de comentarios.";
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
  comments.value = [];
  lastQuerySummary.value = null;
}

const selectedCinemaLabel = computed(() => {
  return cinemaOptions.value.find((opt) => opt.value === form.cinemaId)?.label || null;
});

const selectedRoomLabel = computed(() => {
  if (!form.roomId) return null;
  return roomOptions.value.find((opt) => opt.value === form.roomId)?.label || null;
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
</script>
