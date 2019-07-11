<template>
  <div>
    <b-modal id="edit" :title="'Edit User (' + edit.id +')'">
      <b-form>
        <b-form-group id="ircAccount" label="IRC Account" label-for="ircAccount">
          <b-form-input
            id="ircAccount"
            v-model="edit.ircAccount"
            required
            placeholder="irc account"
          ></b-form-input>
        </b-form-group>
        <b-form-group id="role" label="Role" label-for="role">
          <b-form-select v-model="edit.role" :options="['USER', 'ADMIN', 'OWNER']"></b-form-select>
        </b-form-group>
      </b-form>
      <template slot="modal-footer" slot-scope="{ ok, cancel, hide }">
        <b-button variant="success" @click="editUser()">OK</b-button>
        <b-button variant="danger" @click="cancel()">Cancel</b-button>
      </template>
    </b-modal>
    <b-modal id="add" :title="'Add User'">
      <b-form>
        <b-form-group id="ircAccount" label="IRC Account" label-for="ircAccount">
          <b-form-input
            id="ircAccount"
            v-model="edit.ircAccount"
            required
            placeholder="irc account"
          ></b-form-input>
        </b-form-group>
        <b-form-group id="password" label="Password" label-for="password">
          <b-form-input
            id="password"
            v-model="edit.password"
            required
            placeholder="password"
          ></b-form-input>
        </b-form-group>
        <b-form-group id="role" label="Role" label-for="role">
          <b-form-select v-model="edit.role" :options="['USER', 'ADMIN', 'OWNER']"></b-form-select>
        </b-form-group>
      </b-form>
      <template slot="modal-footer" slot-scope="{ ok, cancel, hide }">
        <b-button variant="success" @click="addUser()">OK</b-button>
        <b-button variant="danger" @click="cancel()">Cancel</b-button>
      </template>
    </b-modal>

    <b-button variant="primary" @click="$bvModal.show('add')">Add User</b-button>
    <b-table striped hover :items="users" :fields="['username', 'role', 'edit', 'delete']">
      <template slot="edit" slot-scope="data">
        <b-button
          @click="openEditUserModal(data.item._id.toString(), data.item.username, data.item.role)"
          variant="info"
        >Edit</b-button>
      </template>
      <template slot="delete" slot-scope="data">
        <b-button @click="removeUser(data.item._id.toString())" variant="danger">Delete</b-button>
      </template>
    </b-table>
    <b-button @click="getUsers">Refresh</b-button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "UserTable",
  data() {
    return {
      users: [],
      fields: ["username", "role"],
      edit: {
        ircAccount: "",
        role: "",
        id: "",
        password: ""
      }
    };
  },
  mounted() {
    this.getUsers();
  },
  methods: {
    addUser() {
      const _this = this;
      axios
        .post(
          `/api/v1/admin/user`,
          {
            ircAccount: this.edit.ircAccount,
            password: this.edit.password,
            role: this.edit.role
          },
          { withCredentials: true }
        )
        .then(response => {
          console.log(response);
          _this.getUsers();
        })
        .catch(err => {
          console.error(err);
        });
    },
    openEditUserModal(id, ircAccount, role) {
      this.edit.id = id;
      this.edit.ircAccount = ircAccount;
      this.edit.role = role;
      this.$bvModal.show("edit");
    },
    removeUser(id) {
      const _this = this;
      axios
        .delete(`/api/v1/admin/user/${id}`, { withCredentials: true })
        .then(response => {
          _this.getUsers();
        });
    },
    editUser() {
      console.log("editing");
      const _this = this;
      axios
        .put(
          `/api/v1/admin/user/${this.edit.id}`,
          {
            ircAccount: this.edit.ircAccount,
            role: this.edit.role
          },
          { withCredentials: true }
        )
        .then(response => {
          _this.getUsers();
          this.$bvModal.hide("edit");
        })
        .catch(err => {
          console.error(err);
        });
    },
    getUsers() {
      const _this = this;
      axios
        .get("/api/v1/admin/users", { withCredentials: true })
        .then(response => {
          _this.users = response.data.users;
        });
    }
  }
};
</script>

<style>
</style>
