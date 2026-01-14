"use client"

import * as React from "react"
import { MapPin, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Command imports removed
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AddressAutocompleteProps {
  value?: string
  onChange: (value: string) => void
  onSelect?: (address: string, lat: number, lon: number) => void
  placeholder?: string
  className?: string
}

interface GeoapifyFeature {
  properties: {
    formatted: string
    lat: number
    lon: number
    address_line1: string
    address_line2: string
    city: string
    country: string
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar dirección...",
  className,
}: AddressAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")
  const [params, setParams] = React.useState<string>("")
  const [predictions, setPredictions] = React.useState<GeoapifyFeature[]>([])
  const [loading, setLoading] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<{lat: number, lon: number} | null>(null)

  // Get user location for bias
  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      }, (error) => {
        console.log("Geolocation blocked or error:", error)
      })
    }
  }, [])

  // Update internal state if external value changes
  React.useEffect(() => {
    if (value && value !== inputValue) {
       setInputValue(value)
    }
  }, [value])

  // Debounce effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) {
        setParams(inputValue)
      } else {
          setPredictions([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Fetch predictions
  React.useEffect(() => {
    if (!params || params.length < 3) return

    const fetchAddresses = async () => {
      setLoading(true)
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
        if (!apiKey) {
            console.error("Geoapify API key not found")
            return
        }

        // Add proximity bias if available
        let biasParam = ""
        if (userLocation) {
          biasParam = `&bias=proximity:${userLocation.lon},${userLocation.lat}`
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            params
          )}${biasParam}&format=json&apiKey=${apiKey}`
        )
        const data = await response.json()
        
        if (data.results) {
             setPredictions(data.results.map((r: any) => ({ properties: r })))
        }
      } catch (error) {
        console.error("Error fetching addresses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [params, userLocation])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <div className="absolute left-3 top-3 z-10">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              onChange(e.target.value)
              if (e.target.value.length >= 3) {
                setOpen(true)
              }
            }}
            onFocus={() => {
              if (inputValue.length >= 3) {
                setOpen(true)
              }
            }}
            placeholder={placeholder}
            className={cn("pl-10 w-full", className)}
            autoComplete="off"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => setOpen(false)}
      >
        <div className="max-h-[300px] overflow-y-auto p-1">
            {loading && (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </div>
            )}
            
            {!loading && predictions.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            )}

            {predictions.map((prediction, index) => (
              <div
                key={`${prediction.properties.lat}-${prediction.properties.lon}-${index}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => {
                  const address = prediction.properties.formatted
                  setInputValue(address)
                  onChange(address)
                  if (onSelect) {
                      onSelect(address, prediction.properties.lat, prediction.properties.lon)
                  }
                  setOpen(false)
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 opacity-50 shrink-0" />
                <div className="flex flex-col">
                    <span className="font-medium">{prediction.properties.address_line1}</span>
                    <span className="text-xs text-muted-foreground">{prediction.properties.address_line2}, {prediction.properties.city}, {prediction.properties.country}</span>
                </div>
              </div>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
