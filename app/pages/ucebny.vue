<script setup>
const supabase = useSupabaseClient()

const ucebny = ref([])
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

  const { data: u } = await supabase.from('ucebny').select('*').order('nazev')
  ucebny.value = (u || []).sort(sortUcebny)

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
    .from('rezervace')
    .select('*, ucebny(nazev)')
    .eq('datum', selectedDate.value)
  rezervace.value = data || []
}

watch(selectedDate, loadRezervace)

function isObsazeno(ucebnaId, hodina) {
  return rezervace.value.some(r => r.ucebna_id === ucebnaId && r.hodina === hodina)
}

function sortUcebny(a, b) {
  const order = ['U01', 'U02']
  const ia = order.indexOf(a.nazev)
  const ib = order.indexOf(b.nazev)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1

  const parse = (s) => {
    const m = s.match(/^([A-Za-z]+)(\d+)$/)
    return m ? { prefix: m[1], num: parseInt(m[2]) } : { prefix: s, num: 0 }
  }
  const pa = parse(a.nazev)
  const pb = parse(b.nazev)
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix)
  return pa.num - pb.num
}

function getRezervace(ucebnaId, hodina) {
  return rezervace.value.find(r => r.ucebna_id === ucebnaId && r.hodina === hodina)
}

function mohuZrusit(r) {
  return userRole.value === 'spravce' || r?.user_id === currentUser.value?.id
}

async function rezervovat(ucebnaId, hodina) {
  if (!currentUser.value) return msg.value = 'Musíte být přihlášeni.'

  const existujici = getRezervace(ucebnaId, hodina)
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
  const { error } = await supabase.from('rezervace').insert({
    ucebna_id: ucebnaId,
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
  const { error } = await supabase.from('rezervace').delete().eq('id', id)
  if (error) msg.value = error.message
  else msg.value = 'Rezervace zrušena.'
  await loadRezervace()
  loading.value = false
}
</script>

<template>
  <div>
    <h1>Rezervace učeben</h1>

    <NuxtLink to="/">← Zpět</NuxtLink>

    <div>
      <label>Datum:</label>
      <input type="date" v-model="selectedDate" />
    </div>

    <p v-if="msg">{{ msg }}</p>
    <p v-if="!currentUser">Pro rezervaci se musíte <NuxtLink to="/signin">přihlásit</NuxtLink>.</p>

    <div style="overflow-x: auto;" v-if="ucebny.length > 0">
      <table border="1" cellpadding="6">
        <thead>
          <tr>
            <th>Učebna</th>
            <th v-for="h in hodiny" :key="h">{{ h }}. hod</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in ucebny" :key="u.id">
            <td><strong>{{ u.nazev }}</strong></td>
            <td v-for="h in hodiny" :key="h">
              <button
                @click="rezervovat(u.id, h)"
                :disabled="loading || !currentUser"
                :style="{ background: isObsazeno(u.id, h) ? (getRezervace(u.id, h)?.user_id === currentUser?.id ? 'orange' : 'red') : 'green', color: 'white' }"
              >
                {{ isObsazeno(u.id, h) ? (getRezervace(u.id, h)?.user_id === currentUser?.id ? '🟠' : '🔴') : '✅' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>