using System.Text.Json;
using System.Text.RegularExpressions;

namespace ResumeAI.API.Utilities
{
    public class SnakeCaseNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return name;
            }

            // Convert camelCase or PascalCase to snake_case
            var result = Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLower();
            return result;
        }
    }
}