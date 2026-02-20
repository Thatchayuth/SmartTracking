<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-2">
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card flat bordered class="login-card q-pa-lg">
          <q-card-section class="text-center q-pb-none">
            <q-icon name="gps_fixed" size="48px" color="primary" />
            <div class="text-h5 text-primary q-mt-sm">SmartTracking</div>
            <div class="text-caption text-grey">GPS Tracking Sale System</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleLogin" class="q-gutter-md">
              <q-input
                v-model="form.employeeCode"
                outlined
                label="Employee Code"
                :rules="[val => !!val || 'Required']"
              >
                <template #prepend>
                  <q-icon name="badge" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                outlined
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :rules="[val => !!val || 'Required']"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <q-btn
                type="submit"
                color="primary"
                label="Login"
                class="full-width"
                size="lg"
                unelevated
                :loading="loading"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../auth.store';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const form = reactive({ employeeCode: '', password: '' });
const showPassword = ref(false);
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login(form.employeeCode, form.password);
    $q.notify({ type: 'positive', message: `Welcome, ${authStore.fullName}!` });

    // Route based on role
    if (authStore.isAdmin || authStore.isManager) {
      router.push({ name: 'report' });
    } else {
      router.push({ name: 'trip-control' });
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Login failed',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
}
</style>
