<script setup>
const supabase = useSupabaseClient()

const nacini = ref([])
const rezervace = ref([])
const userRole = ref(null)
const currentUser = ref(null)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const msg = ref('')

const hodiny = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user

  const { data: n } = await supabase.from('nacini').select('*').order('nazev')
  nacini.value = n || []

  if (user?.id) {
    const { data: p } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole.value = p?.role
  }

  await loadRezervace()
})

async function loadRezervace() {
  const { data } = await supabase
    .from('rezervace_nacini')
    .select('*, nacini(nazev)')
    .eq('datum', selectedDate.value)
  rezervace.value = data || []
}

watch(selectedDate, loadRezervace)

function isObsazeno(naciniId, hodina) {
  return rezervace.value.some(r => r.nacini_id === naciniId && r.hodina === hodina)
}

function getRezervace(naciniId, hodina) {
  return rezervace.value.find(r => r.nacini_id === naciniId && r.hodina === hodina)
}

function mohuZrusit(r) {
  return userRole.value === 'spravce' || r?.user_id === currentUser.value?.id
}

async function rezervovat(naciniId, hodina) {
  if (!currentUser.value) return msg.value = 'Musíte být přihlášeni.'

  const existujici = getRezervace(naciniId, hodina)
  if (existujici) {
    if (mohuZrusit(existujici)) {
      await zrusitRezervaci(existujici.id)
    } else {
      msg.value = 'Tuto rezervaci nemůžete zrušit.'
    }
    return
  }

  loading.value = true
  msg.value = ''
  const { error } = await supabase.from('rezervace_nacini').insert({
    nacini_id: naciniId,
    user_id: currentUser.value.id,
    datum: selectedDate.value,
    hodina
  })
  if (error) msg.value = error.message
  else msg.value = 'Rezervace provedena.'
  await loadRezervace()
  loading.value = false
}

async function zrusitRezervaci(id) {
  loading.value = true
  msg.value = ''
  const { error } = await supabase.from('rezervace_nacini').delete().eq('id', id)
  if (error) msg.value = error.message
  else msg.value = 'Rezervace zrušena.'
  await loadRezervace()
  loading.value = false
}
</script>

<template>
  <div>
    <h1>Rezervace náčiní</h1>

    <NuxtLink to="/">← Zpět</NuxtLink>

    <div>
      <label>Datum:</label>
      <input type="date" v-model="selectedDate" />
    </div>

    <p v-if="msg">{{ msg }}</p>
    <p v-if="!currentUser">Pro rezervaci se musíte <NuxtLink to="/signin">přihlásit</NuxtLink>.</p>

    <div style="overflow-x: auto;" v-if="nacini.length > 0">
      <table border="1" cellpadding="6">
        <thead>
          <tr>
            <th>Náčiní</th>
            <th v-for="h in hodiny" :key="h">{{ h }}. hod</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in nacini" :key="n.id">
            <td><strong>{{ n.nazev }}</strong></td>
            <td v-for="h in hodiny" :key="h">
              <button
                @click="rezervovat(n.id, h)"
                :disabled="loading || !currentUser"
                :style="{ background: isObsazeno(n.id, h) ? (getRezervace(n.id, h)?.user_id === currentUser?.id ? 'orange' : 'red') : 'green', color: 'white' }"
              >
                {{ isObsazeno(n.id, h) ? (getRezervace(n.id, h)?.user_id === currentUser?.id ? '🟠' : '🔴') : '✅' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>