<script>
export default {
    props: ['name', 'label', 'isRequired', 'value', 'size'],
    computed: {
        required() {
            return this.isRequired === true;
        }
    }
};
</script>

<template>
    <div class="ff-address__field">
        <label class="ff-label"
               :for="'field-' + name">
            <span v-html="label"></span>
            <!-- @TODO i18n -->
            <span v-if="!required" class="ff-label-note">(Optional)</span>
        </label>

        <input
            class="ff-text"
            type="text"
            :id="'field-' + name"
            :name="name"
            :value="value"
            :required="required"
            :aria-required="required"
            :size="size || 40"
        />
    </div>
</template>
