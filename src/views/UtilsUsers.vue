<template>
  <div>
    <!-- Form utilitats -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Utilitats amb usuaris del domini Google</h6>
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
                <input class="form-check-input" id="onlyteachers" name="onlyteachers" type="checkbox"
                  v-model="onlyteachers" :disabled="loading"> Incloure professorat</label>
            </div>
            <div class="form-check">
              <label class="form-check-label">
                <input class="form-check-input" id="onlypurge" name="onlypurge" type="checkbox" v-model="onlypurge"
                  :disabled="loading"> Purgar dels grups usuaris desactivats</label>
            </div>
          </div>
          <button class="btn btn-primary" v-on:click="importDomini(false)" :disabled="loading">
            <span v-if="loading || importing" class="spinner-border spinner-border-sm"></span>
            {{ loading && !importing ? 'Simulant operació ...' : 'Simular operació' }}
          </button>
        </form>
      </div>
    </div>
    <!-- Fi Form utilitats -->
    <div class="alert alert-danger alert-dismissible fade show" role="alert" v-for="(error, index) in errors"
      v-bind:key="index">
      <strong>ERROR: </strong>{{ error }}
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
        <h6 class="m-0 font-weight-bold text-primary">Operació</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Informació d'operació</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(log, index) in logs" v-bind:key="index">
                <td>{{ log }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="btn btn-primary" v-on:click="importDomini(true)" :disabled="loading || !logs.length">
          <span v-if="loading || importing" class="spinner-border spinner-border-sm"></span>
          {{ loading && importing ? 'Operant...' : 'Operar' }}
        </button>
        <button class="btn btn-primary" v-on:click="saveLog()" :disabled="loading || !logs.length">
          Guardar informació d'operació a fitxer de text
        </button>
      </div>
    </div>
    <!-- Fi taula mostrar usuaris -->
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import { getDomainUsers } from '@/api/DomainRead'
import { applyDomainChanges } from '@/api/DomainOperations'

export default {
  name: 'UtilsUsers',
  data() {
    return {
      xmlFile: null,
      group: '',
      onlyteachers: false,
      onlypurge: false,
      errors: [],
      loading: false,
      importing: false,
      groupsStudents: [],
      logs: []
    }
  },
  mounted() {
    this.groupsStudents = JSON.parse(sessionStorage.groupsStudents)
  },
  methods: {
    importDomini(apply) {
      this.logs = []
      // LLegim els usuaris del domini
      getDomainUsers(this.logs, (err, domainusers, domaingroups) => {
        if (err) {
          this.errors.push('Error llegint els usuaris del domini "' + err.message + '"')
          this.loading = false
        } else {
          // Aplicam els canvis al domini
          applyDomainChanges(this.logs, null, domainusers, domaingroups, apply, this.group, this.onlyteachers, this.onlypurge, (err, count) => {
            if (err) {
              this.errors.push('Error aplicant els canvis al domini "' + err.message + '"')
              this.loading = false
            } else {
              // Si tot ha anat bé, mostram el resum
              if (apply) {
                this.logs.push(count.purged + ' usuaris han estat purgats')
              } else {
                this.logs.push(count.purged + ' usuaris seran purgats')
              }
              this.loading = false
              this.$bvModal.show('modal-ok')
            }
          })
        }
      })
    },
    saveLog() {
      let blob = new Blob([this.logs.join('\r\n')], { type: 'text/plain;charset=utf-8' })
      let fileName = 'operacio' + (new Date()).toLocaleString() + '.txt'
      saveAs(blob, fileName)
    }
  }
}
</script>

<style>

</style>
