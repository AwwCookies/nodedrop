<template>
  <servue>
    <template slot="content">
      <div>
        <b-container fluid style="padding-left: 0%; padding-right: 0%;">
          <b-navbar toggleable="sm" type="dark" variant="dark">
            <b-navbar-toggle target="nav-text-collapse"></b-navbar-toggle>
            <b-navbar-brand>Nodedrop</b-navbar-brand>
            <b-collapse id="nav-text-collapse" is-nav>
              <b-navbar-nav>
                <!-- <b-nav-text>Navbar text</b-nav-text> -->
              </b-navbar-nav>
            </b-collapse>
          </b-navbar>
        </b-container>
        <b-row>
          <b-col cols="1" class="bg-dark" style="height: 94vh;">
            <b-nav vertical>
              <b-nav-item active @click="activeView = 'home'">Home</b-nav-item>
              <b-nav-item>Settings</b-nav-item>
              <b-nav-item @click="activeView = 'usertable'">Users</b-nav-item>
              <b-nav-item @click="activeView = 'ignoretable'">Ignore List</b-nav-item>
              <b-nav-item disabled>Plugins</b-nav-item>
              <b-nav-item
                @click="activeView = 'plugin/' + plugin.name"
                v-if="plugin.webSettings"
                v-for="plugin in plugins"
              >{{plugin.name}}</b-nav-item>
            </b-nav>
          </b-col>
          <b-col cols="11" style="background-color: grey;">
            <div v-if="activeView === 'home'">
              <h1>I'm main content :)</h1>
            </div>
            <div v-if="activeView.startsWith('plugin/')">
            <iframe width="100%" height="100%" frameBorder="0" :src="activeView
              + '/settings'"></iframe>
            </div>
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
import IgnoreListTable from "components/tables/IgnoreListTable.vue";

Vue.use(BootstrapVue);
export default {
  name: "Nodedrop",
  components: { UserTable, IgnoreListTable },
  data() {
    return {
      users: [],
      activeView: "home",
      plugins: []
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
    },
    restart() {
      axios
        .post("/api/v1/admin/function/restart", { withCredentials: true })
        .then(response => {
          console.log(response);
        });
    },
    getPlugins() {
      const _this = this;
      axios
        .get("/api/v1/admin/info/plugins", { withCredentials: true })
        .then(response => {
          _this.plugins = response.data.plugins;
        });
    }
  },
  mounted() {
    this.getUsers();
    this.getPlugins();
  }
};
</script>
