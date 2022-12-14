<template>
  <ul class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
    <!-- Sidebar - Brand -->
    <router-link to="/" class="sidebar-brand d-flex align-items-center justify-content-center">
        <div class="sidebar-brand-icon rotate-n-15">
          <img style="height: 2rem;" src="../../static/img/logo.png"/>
     <!--   <i class="fab fa-gofore"></i>-->
        </div>
        <div class="sidebar-brand-text mx-3">GestIB2Google Premium</div>
    </router-link>

    <!-- Divider -->
    <hr class="sidebar-divider my-0">

    <!-- Nav Item - Inici -->
    <li class="nav-item">
        <router-link to="/" class="nav-link">
          <i class="fas fa-fw fa-home"></i>
          <span>Inici</span>
        </router-link>
    </li>

    <!-- Nav Item - Importar XML -->
    <li class="nav-item">
        <router-link to="/importxml" class="nav-link">
          <i class="fas fa-fw fa-upload"></i>
          <span>Importar XML</span>
        </router-link>
    </li>

    <!-- Nav Item - Utils Usuaris -->
    <li class="nav-item">
        <router-link to="/utilsusers" class="nav-link">
          <i class="fas fa-fw fa-ghost"></i>
          <span>Utilitats Usuaris</span>
        </router-link>
    </li>

    <!-- Nav Item - Usuaris -->
    <li class="nav-item">
        <router-link to="/users" class="nav-link">
          <i class="fas fa-fw fa-users"></i>
          <span>Usuaris del domini</span>
        </router-link>
    </li>

    <!-- Nav Item - Full de càlcul -->
    <li class="nav-item">
        <router-link to="/spreadsheet" class="nav-link">
          <i class="fas fa-fw fa-table"></i>
          <span>Exportar a full de càlcul</span>
        </router-link>
    </li>

    <!-- Nav Item - Exportar CSV -->
    <li class="nav-item">
        <router-link to="/csv" class="nav-link">
          <i class="fas fa-fw fa-file"></i>
          <span>Exportar a CSV</span>
        </router-link>
    </li>

    <!-- Nav Item - Configuració -->
    <li class="nav-item">
        <router-link to="/setup" class="nav-link">
          <i class="fas fa-cogs"></i>
          <span>Configuració</span>
        </router-link>
    </li>

    <!-- Divider -->
    <hr class="sidebar-divider d-none d-md-block">

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>

  </ul>
</template>

<script>
export default {
  name: 'Sidebar'
}
</script>

<style>

</style>
