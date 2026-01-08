$envVars = @{
    "CLOUDINARY_CLOUD_NAME" = "doulraipp"
    "CLOUDINARY_API_KEY" = "721448654896873"
    "CLOUDINARY_API_SECRET" = "usW5g5orvcn8Bw4-xLFCnbdVi7I"
    "WHATSAPP_TOKEN" = "EAARR3mrVwjABQb7i1TgSXtNusQwfGZAQTI8J5ROzp5PdiZAf6NLOZBixe2yVNK72b0kNIOoERSPqNiKxegVSW9o7DqsgHxGjzREUETcxFp6rmILZCjNypihDwdiNSslco9APMY8AoRqSfWyRHF2ZAIWt2jdffcxRdFJGKUGhyRRgO5fiISR8S82Jxlav28pKa8OhORxgtf7zjdCX0PFyN15FmpWbeupxMACqOkJoSK7K1gkXTUZC41vDhvqVEdHihQHxTQVGNugSQQAJS4cTvxR8nE"
    "WHATSAPP_PHONE_NUMBER_ID" = "936324762899833"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Adding $key..."
    $value | vercel env add $key production
}
