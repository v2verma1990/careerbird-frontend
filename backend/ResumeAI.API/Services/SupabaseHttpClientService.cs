using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace ResumeAI.API.Services
{
    public class SupabaseHttpClientService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly IConfiguration _configuration;
        private readonly string _serviceKey;
        
        public SupabaseHttpClientService(IConfiguration configuration, HttpClient httpClient)
        {           
            _httpClient = httpClient;
            _configuration = configuration;
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url", "Supabase URL is not configured.");
            _serviceKey = configuration["Supabase:ServiceKey"] ?? string.Empty;
            ConfigureHttpClient();
        }
        
        public HttpClient Client => _httpClient;
        public string Url => _supabaseUrl;
        
        public string GetServiceKey() => _serviceKey;
        
        private void ConfigureHttpClient()
        {
            var anonKey = _configuration["Supabase:Key"];
            if (string.IsNullOrEmpty(anonKey))
            {
                throw new ArgumentNullException("Supabase:Key", "Supabase API key is not configured.");
            }
            // Always set anon key as apikey header
            _httpClient.DefaultRequestHeaders.Remove("apikey");
            _httpClient.DefaultRequestHeaders.Add("apikey", anonKey);
            // Do not set Authorization here; it is set per-request
        }
        
        // Method to set JWT token for a specific request
        public void SetAuthToken(string token)
        {
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                // Do NOT change apikey header here; it should remain the anon key
                Console.WriteLine("Set JWT token for Supabase request");
            }
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = null;
                Console.WriteLine("Cleared JWT token for Supabase request");
            }
        }
        
        // Method to use service key for admin operations
        public void SetServiceKey()
        {
            if (!string.IsNullOrEmpty(_serviceKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);
                _httpClient.DefaultRequestHeaders.Remove("apikey");
                _httpClient.DefaultRequestHeaders.Add("apikey", _serviceKey); // Service key as apikey for admin
                Console.WriteLine("Set service key for Supabase request");
            }
            else
            {
                Console.WriteLine("Warning: No service key available");
            }
        }
    }
}
