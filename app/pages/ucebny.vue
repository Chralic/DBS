<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const ucebny = ref([])
const rezervace = ref([])
const userRole = ref(null)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedUcebna = ref(null)
const selectedHodina = ref(null)
const loading = ref(false)
const msg = ref('')

const hodiny = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

onMounted(async () => {
  const { data: u } = await supabase.from('ucebny').select('*').order('nazev')
  ucebny.value = u || []

  if (user.value?.id) {
    const { data: p } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
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

function getRezervace(ucebnaId, hodina) {
  return rezervace.value.find(r => r.ucebna_id === ucebnaId && r.hodina === hodina)
}

async function rezervovat(ucebnaId, hodina) {
  if (!user.value) return msg.value = 'Musíte být přihlášeni.'
  
  const existujici = getRezervace(ucebnaId, hodina)
  if (existujici) {
    if (existujici.user_id === user.value.id) {
      await zrusitRezervaci(existujici.id)
    } else {
      msg.value = 'Tuto rezervaci nemůžete zrušit.'
    }
    return
  }

  loading.value = true
  msg.value = ''
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { error } = await supabase.from('rezervace').insert({
    ucebna_id: ucebnaId,
    user_id: currentUser.id,
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

function mohuZrusit(rezervace) {
  return userRole.value === 'spravce' || rezervace.user_id === user.value?.id
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
    <p v-if="!user">Pro rezervaci se musíte <NuxtLink to="/signin">přihlásit</NuxtLink>.</p>

    <div style="overflow-x: auto;">
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
              <span v-if="isObsazeno(u.id, h)">
                🔴
                <button
                  v-if="mohuZrusit(getRezervace(u.id, h))"
                  @click="zrusitRezervaci(getRezervace(u.id, h).id)"
                  :disabled="loading"
                >
                  Zrušit
                </button>
              </span>
              <button
                v-else
                @click="rezervovat(u.id, h)"
                :disabled="loading || !user"
              >
                ✅
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>