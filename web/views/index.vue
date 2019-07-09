<template>
  <servue>
    <template slot="content">
      <div>
        <b-container fluid style="padding-left: 0%; padding-right: 0%;">
          <b-navbar toggleable="sm" type="dark" variant="dark">
            <b-navbar-toggle target="nav-text-collapse"></b-navbar-toggle>
            <b-navbar-brand>BootstrapVue</b-navbar-brand>
            <b-collapse id="nav-text-collapse" is-nav>
              <b-navbar-nav>
                <b-nav-text>Navbar text</b-nav-text>
              </b-navbar-nav>
            </b-collapse>
          </b-navbar>
        </b-container>
        <b-row>
          <b-col cols="1" class="bg-dark" style="height: 94vh;">
            <b-nav vertical>
              <b-nav-item active>Home</b-nav-item>
              <b-nav-item>Settings</b-nav-item>
              <b-nav-item @click="activeView = 'usertable'">Users</b-nav-item>
              <b-nav-item @click="activeView = 'ignoretable'">Ignore List</b-nav-item>
              <b-nav-item disabled>Plugins</b-nav-item>
              <b-nav-item v-for="n in ['Spotify', 'Soundcloud']">{{n}}</b-nav-item>
            </b-nav>
          </b-col>
          <b-col cols="11" style="background-color: grey;">
            <UserTable v-if="activeView === 'usertable'"></UserTable>
            <IgnoreListTable v-if="activeView === 'ignoretable'"></IgnoreListTable>
          </b-col>
        </b-row>
      </div>
    </template>
  </servue>
</template>

<script>
import Vue from "vue";
import axios from "axios";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import UserTable from "components/tables/UserTable.vue";
import IgnoreListTable from "components/tables/IgnoreListTable.vue"

Vue.use(BootstrapVue);
export default {
  name: "Nodedrop",
  components: { UserTable, IgnoreListTable },
  data() {
    return {
      users: [],
      activeView: ''
    };
  },
  methods: {
    getUsers() {
      const _this = this;
      axios
        .get("/api/v1/admin/users", { withCredentials: true })
        .then(response => {
          _this.users = response.data.users;
        });
    }
  },
  mounted() {
    this.getUsers();
  }
};
</script>
