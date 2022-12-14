<template>
  <div>
    <!-- Form mostrar usuaris -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
          <h6 class="m-0 font-weight-bold text-primary">Mostrar usuaris del domini</h6>
      </div>
      <div class="card-body">
        <form @submit.prevent>
          <div class="form-group">
            <label for="group" class="col-sm col-form-label">Grup d'alumnes</label>
            <div class="col-sm-10">
              <select class="form-control" id="group" name="group" v-model="group" :disabled="loading">
                <option value="">Tots</option>
                <option v-for="group in groupsStudents" v-bind:key="group.email" v-bind:value="group.email">
                  {{ group.nameWithEmail }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                <input class="form-check-input" id="onlyteachers" name="onlyteachers" type="checkbox" v-model="onlyteachers" :disabled="loading"> Només professorat</label>
              </div>
          </div>
          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                <input class="form-check-input" id="onlystudents" name="onlystudents" type="checkbox" v-model="onlystudents" :disabled="loading"> Només alumnat</label>
              </div>
          </div>
          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                <input class="form-check-input" id="onlyactive" name="onlyactive" type="checkbox" v-model="onlyactive" :disabled="loading"> Només usuaris actius</label>
              </div>
          </div>
          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input" id="onlywithoutcode" name="onlywithoutcode" type="checkbox" v-model="onlywithoutcode" :disabled="loading"> Només els usuaris sense ID
                </label>
              </div>
          </div>
          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input" id="onlynotsession" name="onlynotsession" type="checkbox" v-model="onlynotsession" :disabled="loading"> Només els usuaris que no han iniciat mai sessió
                </label>
              </div>
          </div>
          <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input" id="onlywithoutorgunit" name="onlywithoutorgunit" type="checkbox" v-model="onlywithoutorgunit" :disabled="loading"> Només els usuaris de la Unitat Organitzativa principal (/)
                </label>
              </div>
            </div>
            <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input" id="onlywiththistext" name="onlywiththistext" type="checkbox" v-model="onlywiththistext" :disabled="loading"> Usuaris amb aquest text dins l'email
                  <br>
                  <input class="form-text-input" id="submail" name="submail" type="text" v-model="submail" :disabled="loading">
    
                </label>
              </div>
            </div>           
		      <div class="form-group">
              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input" id="onlydisabledwithgroups" name="onlydisabledwithgroups" type="checkbox" v-model="onlydisabledwithgroups" :disabled="loading"> Usuaris desactivats que pertanyen a algun grup
                </label>
              </div>
            </div>
          <div class="form-group">
            <button class="btn btn-primary" v-on:click="showUsers()" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              {{ loading ? 'Carregant ...' : 'Mostrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- Fi form mostrar usuaris -->
    <div class="alert alert-danger alert-dismissible fade show" role="alert" v-for="(error, index) in errors" v-bind:key="index">
      <strong>ERROR: </strong>{{error}}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <b-modal id="modal-ok" title="GestIB2Google" ok-only>
      <p class="my-4">Procés finalitzat!</p>
    </b-modal>
    <!-- Taula mostrar usuaris -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Usuaris trobats: {{ users.length }}</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Professor/Alumne</th>
                <th>Grups</th>
                <th>Unitat</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th colspan="5">Total usuaris trobats: {{ users.length }}</th>
              </tr>
            </tfoot>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" v-if="loading">Carregant ...</td>
              </tr>
              <tr v-if="!users.length && !loading">
                <td colspan="5">No hi ha dades carregades</td>
              </tr>
              <tr v-for="user in users" v-bind:key="user.id">
                <td>{{ user.surname + ', ' + user.name }}</td>
                <td><a target='_blank' :href="'https://admin.google.com/ac/search?query='+user.domainemail">{{ user.domainemail }}</a></td>
                <td>{{ user.teacher ? 'PROFESSOR' : 'Alumne' }}</td>
                <td>{{ user.groups.join(', ') }}</td>
                <td>{{ user.organizationalUnit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- Fi taula mostrar usuaris -->
  </div>
</template>

<script>
import {getDomainUsers} from '@/api/DomainRead'

export default {
  name: 'Users',
  data () {
    return {
      group: '',
      onlyteachers: false,
      onlyactive: false,
      onlywithoutcode: false,
      onlynotsession: false,
      onlywithoutorgunit: false,
      errors: [],
      loading: false,
      groupsStudents: [],
      users: []
    }
  },
  mounted () {
    this.groupsStudents = JSON.parse(sessionStorage.groupsStudents)
  },
  methods: {
    showUsers () {
      this.loading = true
      this.users = []
      getDomainUsers(null, (err, users) => {
        if (err) {
          this.errors.push('Error llegint usuaris "' + err.message + '"')
        } else {
          Object.keys(users).forEach(user => {
        if (!this.onlywiththistext || users[user].domainemail.includes(this.submail)){
            if (!this.onlywithoutcode || users[user].withoutcode || (users[user].id.length < 15)) {
              if (!this.onlynotsession || (users[user].lastLoginTime.getFullYear() < 1980)) {
                if (!this.onlywithoutorgunit || (users[user].organizationalUnit === '/')) {
                  if (!this.onlyteachers || users[user].teacher) {
				  if (!this.onlystudents || !users[user].teacher) {
                    if (!this.onlyactive || !users[user].suspended) {
					  if (!this.onlydisabledwithgroups || (users[user].suspended && users[user].groups.length>0)){
                      if (!this.group || users[user].groups.includes(this.group)) {
                        this.users.push(users[user])
                      }
					  }
					  }
                    }
                  }
                }
              }
            }
          }
        })
        }
        this.loading = false
        this.$bvModal.show('modal-ok')
      })
    }
  }
}
</script>

<style>

</style>
