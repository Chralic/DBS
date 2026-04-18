<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const userRole = ref(null)

// Načti roli po přihlášení
onMounted(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser?.id) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    userRole.value = data?.role
  }
})

async function signIn() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
  if (error) errorMsg.value = error.message
  else navigateTo('/')
  loading.value = false
}

async function signUp() {
  loading.value = true
  errorMsg.value = ''
  const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
  if (error) errorMsg.value = error.message
  else errorMsg.value = 'Zkontrolujte email pro potvrzení registrace.'
  loading.value = false
}

async function signOut() {
  await supabase.auth.signOut()
  userRole.value = null
  navigateTo('/')
}
</script>

<template>
  <div>
    <div v-if="user">
      <p>Přihlášen jako: {{ user.email }}</p>
      <p>Role: <strong>{{ userRole }}</strong></p>
      <p v-if="userRole === 'spravce'">✅ Máte přístup správce.</p>
      <p v-if="userRole === 'student'">📚 Přihlášen jako student.</p>
      <button @click="signOut">Odhlásit se</button>
    </div>

    <div v-else>
      <h2>Přihlášení / Registrace</h2>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Heslo" />
      <p v-if="errorMsg">{{ errorMsg }}</p>
      <button @click="signIn" :disabled="loading">Přihlásit se</button>
      <button @click="signUp" :disabled="loading">Registrovat se</button>
    </div>
  </div>
</template>