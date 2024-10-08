<template>
  <div class="container my-4">
    <!-- Domain Input and Options -->
    <div class="text-center mb-4">
      <input
        type="text"
        v-model="domainName"
        class="form-control mb-3"
        placeholder="Enter a domain name"
      />
      <div>
        <label>
          <input type="radio" v-model="selectInfo" value="domain" />
          Domain Information
        </label>
        <label class="ms-3">
          <input type="radio" v-model="selectInfo" value="contact" />
          Contact Information
        </label>
      </div>
      <button
        class="btn btn-primary mt-3"
        @click="fetchDomainInfo"
        :disabled="loading"
      >
        {{ loading ? "Loading..." : "Lookup Domain" }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-danger text-center">
      {{ errorMessage }}
    </div>

    <!-- Domain Information Table -->
    <div v-if="selectInfo === 'domain' && domainInfo" style="max-width: 1200px; min-width: 390px;">
      <h2 class="text-left mb-3">Domain Information</h2>
      <div class="table-responsive mx-auto">
        <table class="table table-bordered table-striped">
          <thead class="table-dark">
            <tr class="text-center">
              <th>Domain Name</th>
              <th>Registrar</th>
              <th>Registration Date</th>
              <th>Expiration Date</th>
              <th>Estimated Domain Age</th>
              <th>Hostnames</th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center">
              <td>{{ domainInfo.name }}</td>
              <td>{{ domainInfo.registrar }}</td>
              <td>{{ domainInfo.registrationDate }}</td>
              <td>{{ domainInfo.expirationDate }}</td>
              <td>{{ domainInfo.estimatedAge }}</td>
              <td>{{ truncatedHostnames }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Contact Information Table -->
    <div v-if="selectInfo === 'contact' && contactInfo" style="max-width: 1200px; min-width: 390px;">
      <h2 class="text-left mb-3">Contact Information</h2>
      <div class="table-responsive mx-auto">
        <table class="table table-bordered table-striped">
          <thead class="table-dark">
            <tr class="text-center">
              <th>Registrant Name</th>
              <th>Technical Contact Name</th>
              <th>Administrative Contact Name</th>
              <th>Contact Email</th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-center">
              <td>{{ contactInfo.registrantName }}</td>
              <td>{{ contactInfo.technicalContactName }}</td>
              <td>{{ contactInfo.administrativeContactName }}</td>
              <td>{{ contactInfo.email }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';

const domainName = ref('amazon.com'); 
const selectInfo = ref(''); 
const loading = ref(false); 
const errorMessage = ref(''); 
const domainInfo = ref(null); 
const contactInfo = ref(null);
const runtimeConfig = useRuntimeConfig();

/**
 * Fetches domain information asynchronously using the WHOIS API and updates the relevant data properties.
 * 
 * - Resets the `errorMessage`, `loading`, `domainInfo`, and `contactInfo` properties before making the API request.
 * - Checks if any information type is selected, and if not, sets an error message and stops further execution.
 * - Makes an API call to retrieve WHOIS data based on the domain name provided in `domainName.value`.
 * - Depending on the selected information type (`domain` or `contact`), parses the response and updates `domainInfo` or `contactInfo`.
 * - Handles possible errors by setting appropriate error messages.
 * - Ensures the `loading` state is reset once the process is completed, whether it succeeds or fails.
 **/
const fetchDomainInfo = async () => {
    errorMessage.value = '';
    loading.value = true;
    domainInfo.value = null;
    contactInfo.value = null;

    if (!selectInfo.value) {
        errorMessage.value = 'Please select at least one information type.';
        loading.value = false;
        return;
    }

    try {
        const apiUrl = `${runtimeConfig.public.api_url}/api/whois`; 
        const params = { domainName: domainName.value };
        const response = await axios.get(apiUrl, { params });
        const whoisRecord = response.data.WhoisRecord;

        if (!whoisRecord) {
            throw new Error('Invalid response from WHOIS API.');
        }

        if (typeof whoisRecord.dataError !=='undefined' && whoisRecord.dataError === 'MISSING_WHOIS_DATA') {
            throw new Error('Invalid response from WHOIS API.');
        }

        if (selectInfo.value === 'domain') {
            domainInfo.value = {
                name: whoisRecord.domainName || 'N/A',
                registrar: whoisRecord.registrarName || 'N/A',
                registrationDate: whoisRecord.createdDate
                                ? whoisRecord.createdDate.split('T')[0]
                                : 'N/A',
                expirationDate: whoisRecord.expiresDate
                                ? whoisRecord.expiresDate.split('T')[0]
                                : 'N/A',
                estimatedAge: calculateAge(whoisRecord.createdDate),
                hostnames:  whoisRecord.registryData.nameServers.hostNames ?? []
            };
        }

        if (selectInfo.value === 'contact') {
            contactInfo.value = {
                registrantName: whoisRecord.registrant?.name || 'N/A',
                technicalContactName: whoisRecord.technicalContact?.name || 'N/A',
                administrativeContactName: whoisRecord.administrativeContact?.name || 'N/A',
                email: whoisRecord.contactEmail || 'N/A',
            };
        }
    } catch (error) {
        console.error(error);
        errorMessage.value = 'Failed to fetch domain information. Please try again.';
    } finally {
        loading.value = false;
    }
};

/**
 * Computes a truncated string of hostnames from the `domainInfo` object.
 * If `domainInfo` or its `hostnames` property is not available, returns an empty string.
 * Joins the hostnames into a single string separated by commas.
 * If the resulting string exceeds 25 characters, truncates it to 22 characters and appends '...'.
 * Otherwise, returns the full string.
 **/
const truncatedHostnames = computed(() => {
    if (!domainInfo.value || !domainInfo.value.hostnames) return '';
    const hostnamesStr = domainInfo.value.hostnames.join(', ');
    return hostnamesStr.length > 25 ? hostnamesStr.slice(0, 22) + '...' : hostnamesStr;
});

/**
 * This function calculates the age in years based on the provided creation date.
 * It takes a date string as input (`createdDate`) and returns the number of years 
 * that have passed since that date. If `createdDate` is not provided, it returns 'N/A'.
 * The calculation accounts for leap years by dividing the difference in milliseconds 
 * by the number of milliseconds in an average year (365.25 days).
**/
const calculateAge = (createdDate) => {
    if (!createdDate) return 'N/A';

    const created = new Date(createdDate);
    const now = new Date();
    const diffMs = now - created;
    const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    return `${diffYears} years`;
};
</script>