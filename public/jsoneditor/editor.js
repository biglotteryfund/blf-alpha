Vue.options.delimiters = ['<%', '%>'];

const getType = function (obj) {
    if (Array.isArray(obj)) {
        return 'array';
    } else {
        return typeof obj;
    }
}

Vue.component('field', {
    props: ['section', 'label'],
    template: `<div>
        <h3 v-if="label"><% label %></h3>
        <input type="text" v-model="this.section" />
    </div>`
});

Vue.component('looper', {
    props: ['section', 'label'],
    methods: {
        gettype: getType
    },
    template: `<li>
        <div v-if="gettype(section) === 'array'">
            <field v-for="(value, key) in section" v-bind:section="value"></field>
        </div>
        <div v-if="gettype(section) === 'string'">
            <field v-bind:section="section" v-bind:label="label"></field>
        </div>
        <div v-if="gettype(section) === 'object'">
            <h2><% label %></h2>
            <ul>
                <looper v-for="(value, key) in section" v-bind:section="value" v-bind:label="key"></looper>
            </ul>
        </div>
    </li>`
});


Vue.component('editor', {
    props: ['section', 'label'],
    methods: {
        gettype: getType,
        getData: function () {
            console.log(this.section);
        }
    },
    template: `<div>
        <h1><% label %></h1>
        <looper v-for="(value, key, index) in section" v-bind:section="value" v-bind:label="key"></looper>
        <button v-on:click="getData()">lol</button>
    </div>`
})

fetch(window.location, { method: 'post' }).then((r) => r.json()).then((json) => {
    const vueApp = new Vue({
        el: '#js-vue',
        data: {
            locale: json,
        },
        methods: {
            gettype: getType
        }
    });
});