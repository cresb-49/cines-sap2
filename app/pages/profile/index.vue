<template>
  <div class="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-slate-50">
    <header class="max-w-3xl mx-auto mb-8" role="banner">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
        Mi perfil
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        Revisa tu información y el estado actual de tu billetera virtual.
      </p>
    </header>

    <main class="max-w-3xl mx-auto space-y-8" role="main">
      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-4">
        <h2 class="text-xl font-semibold text-slate-900">Información personal</h2>
        <div v-if="!user" class="text-sm text-slate-600">
          Debes iniciar sesión para visualizar tu perfil.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <p class="font-medium text-slate-600">Nombre</p>
            <p class="mt-1 text-slate-900 font-semibold">
              <span v-if="accountStatus === 'loading' && !account">
                <i class="pi pi-spinner pi-spin mr-2" aria-hidden="true"></i>
                Cargando…
              </span>
              <span v-else>{{ displayFullName }}</span>
            </p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Correo electrónico</p>
            <p class="mt-1 text-slate-900 font-semibold">
              <span v-if="accountStatus === 'loading' && !account">
                <i class="pi pi-spinner pi-spin mr-2" aria-hidden="true"></i>
                Cargando…
              </span>
              <span v-else>{{ displayEmail }}</span>
            </p>
          </div>
          <div>
            <p class="font-medium text-slate-600">Identificador</p>
            <p class="mt-1 font-mono text-xs text-slate-800 break-all">{{ user.userId }}</p>
          </div>
          <div v-if="authStore.rol">
            <p class="font-medium text-slate-600">Rol</p>
            <p class="mt-1 text-slate-900 font-semibold uppercase">{{ authStore.rol }}</p>
          </div>
          <div v-if="accountStatus === 'error'" class="sm:col-span-2 text-sm text-red-600">
            {{ accountErrorMessage }}
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-slate-900">Actualizar información personal</h2>
            <p class="text-sm text-slate-600">
              Modifica tu nombre y correo electrónico. Los cambios se aplican inmediatamente.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              :label="profileLocked ? 'Habilitar edición' : 'Bloquear formulario'"
              :icon="profileLocked ? 'pi pi-lock' : 'pi pi-lock-open'"
              severity="secondary"
              outlined
              size="small"
              :disabled="!user"
              @click="toggleProfileLock"
            />
            <p v-if="profileLocked" class="text-xs text-slate-500">Haz clic en el candado para realizar cambios.</p>
          </div>
        </div>
        <div v-if="!user" class="text-sm text-slate-600">
          Debes iniciar sesión para actualizar tu información.
        </div>
        <div
          v-else-if="accountStatus === 'loading' && !account"
          class="py-6 text-center text-slate-600"
        >
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando información del usuario…
        </div>
        <div v-else-if="accountStatus === 'error' && !account" class="py-6 text-center text-red-600">
          {{ accountErrorMessage }}
        </div>
        <form v-else class="space-y-6" @submit.prevent="handleUpdateProfile">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="firstName">
                Nombre *
              </label>
              <InputText
                id="firstName"
                v-model.trim="profileForm.firstName"
                autocomplete="given-name"
                :disabled="updatingProfile || profileLocked"
                class="w-full"
              />
              <p v-if="profileErrors.firstName" class="mt-1 text-sm text-red-600">
                {{ profileErrors.firstName }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="lastName">
                Apellido *
              </label>
              <InputText
                id="lastName"
                v-model.trim="profileForm.lastName"
                autocomplete="family-name"
                :disabled="updatingProfile || profileLocked"
                class="w-full"
              />
              <p v-if="profileErrors.lastName" class="mt-1 text-sm text-red-600">
                {{ profileErrors.lastName }}
              </p>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="email">
              Correo electrónico *
            </label>
            <InputText
              id="email"
              v-model.trim="profileForm.email"
              type="email"
              autocomplete="email"
              :disabled="updatingProfile || profileLocked"
              class="w-full"
            />
            <p v-if="profileErrors.email" class="mt-1 text-sm text-red-600">
              {{ profileErrors.email }}
            </p>
          </div>
          <div class="flex items-center justify-end">
            <Button
              type="submit"
              label="Guardar cambios"
              icon="pi pi-save"
              :loading="updatingProfile"
              :disabled="updatingProfile || profileLocked"
            />
          </div>
        </form>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-slate-900">Actualizar contraseña</h2>
            <p class="text-sm text-slate-600">
              Usa una contraseña segura con al menos 8 caracteres.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              :label="passwordLocked ? 'Habilitar edición' : 'Bloquear formulario'"
              :icon="passwordLocked ? 'pi pi-lock' : 'pi pi-lock-open'"
              severity="secondary"
              outlined
              size="small"
              :disabled="!user"
              @click="togglePasswordLock"
            />
            <p v-if="passwordLocked" class="text-xs text-slate-500">Desbloquea para modificar tu contraseña.</p>
          </div>
        </div>
        <div v-if="!user" class="text-sm text-slate-600">
          Debes iniciar sesión para cambiar tu contraseña.
        </div>
        <form v-else class="space-y-6" @submit.prevent="handleUpdatePassword">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="password">
                Nueva contraseña *
              </label>
              <InputText
              id="password"
              v-model.trim="passwordForm.password"
              type="password"
              autocomplete="new-password"
              :disabled="updatingPassword || passwordLocked"
              class="w-full"
              maxlength="100"
            />
              <p v-if="passwordErrors.password" class="mt-1 text-sm text-red-600">
                {{ passwordErrors.password }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2" for="confirmPassword">
                Confirmar contraseña *
              </label>
              <InputText
              id="confirmPassword"
              v-model.trim="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              :disabled="updatingPassword || passwordLocked"
              class="w-full"
              maxlength="100"
            />
              <p v-if="passwordErrors.confirmPassword" class="mt-1 text-sm text-red-600">
                {{ passwordErrors.confirmPassword }}
              </p>
            </div>
          </div>
          <div class="flex items-center justify-end">
            <Button
              type="submit"
              label="Actualizar contraseña"
              icon="pi pi-shield"
              :loading="updatingPassword"
              :disabled="updatingPassword || passwordLocked"
            />
          </div>
        </form>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Mi wallet</h2>
            <p class="text-sm text-slate-600">
              Consulta tu saldo disponible y la última actualización de tu billetera.
            </p>
          </div>
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            :loading="walletStatus === 'loading'"
            :disabled="walletStatus === 'loading' || !user"
            @click="() => walletRefetch()"
          />
        </div>

        <div v-if="!user" class="py-10 text-center text-slate-600">
          Debes iniciar sesión para consultar tu wallet.
        </div>
        <div
          v-else-if="walletStatus === 'loading' && !wallet"
          class="py-10 text-center text-slate-600"
        >
          <i class="pi pi-spinner pi-spin text-2xl mb-3" aria-hidden="true"></i>
          Cargando información de la wallet…
        </div>
        <div v-else-if="walletStatus === 'error'" class="py-10 text-center text-red-600 space-y-2">
          <p>{{ walletErrorMessage }}</p>
          <p class="text-xs text-red-500">
            Si aún no tienes una wallet creada, solicita soporte para generarla.
          </p>
        </div>
        <div v-else-if="!wallet" class="py-10 text-center text-slate-600 space-y-4">
          <p>No encontramos una wallet asociada a tu usuario.</p>
          <div class="flex flex-col items-center gap-2">
            <Button
              label="Crear wallet"
              icon="pi pi-wallet"
              severity="success"
              :loading="creatingWallet"
              :disabled="creatingWallet"
              @click="handleCreateWallet"
            />
            <p class="text-xs text-slate-500">Genera tu billetera para empezar a recibir saldo disponible.</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
          <div class="rounded-xl bg-slate-900 text-white p-5 flex flex-col gap-3">
            <p class="text-xs uppercase tracking-wide text-slate-300">Saldo disponible</p>
            <p class="text-3xl font-bold">{{ formatCurrency(wallet.balance) }}</p>
            <p class="text-xs text-slate-400">
              ID de wallet:
              <span class="font-mono break-all">{{ wallet.id }}</span>
            </p>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Propietario</p>
              <p class="mt-1 text-base text-slate-900">{{ user.username }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Tipo</p>
              <p class="mt-1 text-base text-slate-900">{{ wallet.ownerType }}</p>
            </div>
            <div>
              <p class="text-xs uppercase font-semibold text-slate-600">Actualizado</p>
              <p class="mt-1 text-base text-slate-900">{{ lastUpdated }}</p>
            </div>
          </div>

          <div class="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">Recargar billetera</p>
              <p class="text-xs text-slate-600">
                Ingresa el monto que deseas añadir a tu saldo disponible.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <InputNumber
                v-model="rechargeAmount"
                mode="currency"
                currency="GTQ"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :min="1"
                :disabled="recharging"
                class="w-full sm:max-w-xs"
                placeholder="Q0.00"
              />
              <Button
                label="Recargar"
                icon="pi pi-plus"
                severity="success"
                :loading="recharging"
                :disabled="recharging || !canRecharge"
                @click="handleRechargeWallet"
              />
            </div>
            <p v-if="rechargeError" class="text-sm text-red-600">
              {{ rechargeError }}
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'
import {
  createWallet,
  getWalletByOwner,
  rechargeWallet,
  OwnerType,
  type Wallet,
} from '~/lib/api/wallets/wallet'
import {
  getUserById,
  updatePassword,
  updateUser,
  type SaveUserDTO,
  type UpdatePasswordDTO,
  type UserResponseDTO,
} from '~/lib/api/users/user'
import { useCustomQuery } from '~/composables/useCustomQuery'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const userId = computed(() => user.value?.userId ?? '')

const {
  state: accountState,
  asyncStatus: accountAsyncStatus,
  refetch: accountRefetch,
} = useCustomQuery({
  key: ['profile-user', () => userId.value],
  query: async () => {
    const id = userId.value
    if (!id) {
      return null
    }
    try {
      return await getUserById(id)
    } catch (error: any) {
      const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status
      if (statusCode === 404) {
        return null
      }
      throw error
    }
  },
})

const accountStatus = computed<'idle' | 'loading' | 'success' | 'error'>(() => {
  const v = accountAsyncStatus?.value ?? 'idle'
  return String(v) as 'idle' | 'loading' | 'success' | 'error'
})

const account = computed<UserResponseDTO | null>(() => {
  const data = accountState.value?.data as UserResponseDTO | null | undefined
  return data ?? null
})

const accountErrorMessage = computed(() => {
  const error = accountState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo obtener la información del usuario.'
})

const profileForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
})

const profileErrors = reactive<Record<keyof typeof profileForm, string | null>>({
  firstName: null,
  lastName: null,
  email: null,
})

const updatingProfile = ref(false)
const profileLocked = ref(true)

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})

const passwordErrors = reactive<Record<keyof typeof passwordForm, string | null>>({
  password: null,
  confirmPassword: null,
})

const updatingPassword = ref(false)
const passwordLocked = ref(true)

const displayFullName = computed(() => {
  const first = account.value?.profile?.firstName ?? ''
  const last = account.value?.profile?.lastName ?? ''
  const fullName = `${first} ${last}`.replace(/\s+/g, ' ').trim()
  if (fullName) {
    return fullName
  }
  return user.value?.username ?? '—'
})

const displayEmail = computed(() => account.value?.email ?? '—')

watch(
  () => account.value,
  (detail) => {
    if (!detail) return
    profileForm.firstName = detail.profile?.firstName ?? ''
    profileForm.lastName = detail.profile?.lastName ?? ''
    profileForm.email = detail.email ?? ''
  },
  { immediate: true }
)

watch(
  () => userId.value,
  (id) => {
    if (!id) {
      profileForm.firstName = ''
      profileForm.lastName = ''
      profileForm.email = ''
      profileErrors.firstName = null
      profileErrors.lastName = null
      profileErrors.email = null
      passwordForm.password = ''
      passwordForm.confirmPassword = ''
      passwordErrors.password = null
      passwordErrors.confirmPassword = null
    }
    profileLocked.value = true
    passwordLocked.value = true
  }
)

function toggleProfileLock() {
  if (!userId.value) return
  profileLocked.value = !profileLocked.value
}

function togglePasswordLock() {
  if (!userId.value) return
  passwordLocked.value = !passwordLocked.value
}

function validateProfileForm() {
  const first = profileForm.firstName.trim()
  const last = profileForm.lastName.trim()
  const email = profileForm.email.trim()

  profileErrors.firstName =
    first.length >= 2 ? null : 'El nombre debe tener al menos 2 caracteres.'
  profileErrors.lastName =
    last.length >= 2 ? null : 'El apellido debe tener al menos 2 caracteres.'
  profileErrors.email =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length >= 5
      ? null
      : 'Ingresa un correo electrónico válido.'

  return !profileErrors.firstName && !profileErrors.lastName && !profileErrors.email
}

async function handleUpdateProfile() {
  if (!userId.value || updatingProfile.value || profileLocked.value) return
  if (!validateProfileForm()) return

  updatingProfile.value = true

  try {
    const payload: SaveUserDTO = {
      email: profileForm.email.trim(),
      profile: {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
      },
    }
    const updated = await updateUser(userId.value, payload)
    const updatedFullName = `${updated.profile?.firstName ?? ''} ${updated.profile?.lastName ?? ''}`
      .replace(/\s+/g, ' ')
      .trim()
    authStore.user = {
      username:
        updatedFullName || authStore.user?.username || updated.email,
      userId: updated.id,
    }
    toast.success('Información actualizada correctamente.')
    profileLocked.value = true
    await accountRefetch()
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo actualizar la información.'
    toast.error(message)
  } finally {
    updatingProfile.value = false
  }
}

function validatePasswordForm() {
  const password = passwordForm.password.trim()
  const confirm = passwordForm.confirmPassword.trim()

  passwordErrors.password =
    password.length >= 8 ? null : 'La contraseña debe tener al menos 8 caracteres.'
  passwordErrors.confirmPassword =
    password === confirm ? null : 'Las contraseñas no coinciden.'

  return !passwordErrors.password && !passwordErrors.confirmPassword
}

async function handleUpdatePassword() {
  if (!userId.value || updatingPassword.value || passwordLocked.value) return
  if (!validatePasswordForm()) return

  updatingPassword.value = true

  try {
    const payload: UpdatePasswordDTO = {
      password: passwordForm.password.trim(),
    }
    await updatePassword(userId.value, payload)
    toast.success('Contraseña actualizada correctamente.')
    passwordForm.password = ''
    passwordForm.confirmPassword = ''
    passwordLocked.value = true
  } catch (error: any) {
    const message =
      error?.data?.message ?? error?.message ?? 'No se pudo actualizar la contraseña.'
    toast.error(message)
  } finally {
    updatingPassword.value = false
  }
}

const {
  state: walletState,
  asyncStatus: walletAsyncStatus,
  refetch: walletRefetch,
} = useCustomQuery({
  key: ['profile-wallet', () => userId.value],
  query: async () => {
    const id = userId.value
    if (!id) {
      return null
    }
    try {
      return await getWalletByOwner(id)
    } catch (error: any) {
      const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status
      if (statusCode === 404) {
        return null
      }
      throw error
    }
  },
})

const walletStatus = computed<'idle' | 'loading' | 'success' | 'error'>(() => {
  const v = walletAsyncStatus?.value ?? 'idle'
  return String(v) as 'idle' | 'loading' | 'success' | 'error'
})
const wallet = computed<(Wallet & { createdAt?: string; updatedAt?: string }) | null>(() => {
  const data = walletState.value?.data as (Wallet & { createdAt?: string; updatedAt?: string }) | null | undefined
  return data ?? null
})
const walletErrorMessage = computed(() => {
  const error = walletState.value?.error as { message?: string } | undefined
  return error?.message ?? 'No se pudo obtener la información de la wallet.'
})

const lastUpdated = computed(() => {
  const updatedAt = wallet.value?.updatedAt ?? wallet.value?.createdAt
  if (!updatedAt) return '—'
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const creatingWallet = ref(false)
const recharging = ref(false)
const rechargeAmount = ref<number | null>(100)
const rechargeError = ref<string | null>(null)

const canRecharge = computed(() => Boolean(wallet.value && userId.value))

async function handleCreateWallet() {
  if (!userId.value || creatingWallet.value) return
  creatingWallet.value = true
  try {
    await createWallet({
      ownerId: userId.value,
      ownerType: OwnerType.CUSTOMER,
    })
    toast.success('Wallet creada correctamente.')
    await walletRefetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo crear la wallet.'
    toast.error(message)
  } finally {
    creatingWallet.value = false
  }
}

async function handleRechargeWallet() {
  if (!canRecharge.value || recharging.value) return

  rechargeError.value = null

  const amount = typeof rechargeAmount.value === 'number' ? rechargeAmount.value : 0
  if (!Number.isFinite(amount) || amount <= 0) {
    rechargeError.value = 'Ingresa un monto mayor a cero.'
    return
  }

  recharging.value = true

  try {
    await rechargeWallet(userId.value, { amount })
    toast.success('Saldo recargado correctamente.')
    rechargeAmount.value = 100
    await walletRefetch()
  } catch (error: any) {
    const message = error?.data?.message ?? error?.message ?? 'No se pudo recargar la wallet.'
    rechargeError.value = message
    toast.error(message)
  } finally {
    recharging.value = false
  }
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(value)
}
</script>
