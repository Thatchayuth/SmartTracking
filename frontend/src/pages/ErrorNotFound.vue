<template>
  <div class="fullscreen bg-blue-grey-1 flex flex-center">
    <div class="text-center q-pa-xl">
      <q-icon name="warning" size="80px" color="grey-5" class="q-mb-md" />
      <h4 class="text-grey-7">404 - ไม่พบหน้านี้</h4>
      <p class="text-grey-5">ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ</p>
      <q-btn
        color="primary"
        label="กลับหน้าหลัก"
        icon="home"
        :to="{ name: 'login' }"
        class="q-mt-md"
      />
    </div>
  </div>
</template>
